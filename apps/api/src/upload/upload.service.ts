import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { CloudinaryService, ImageCategory, UploadResult } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly prisma: PrismaService,
  ) {}

  validateAndPrepare(file: Express.Multer.File): Buffer {
    this.cloudinaryService.validateFile(file);
    return file.buffer;
  }

  async uploadAvatar(buffer: Buffer, userId: string): Promise<UploadResult> {
    return this.cloudinaryService.uploadUserAvatar(buffer, userId);
  }

  async uploadCover(buffer: Buffer, userId: string): Promise<UploadResult> {
    return this.cloudinaryService.uploadUserCover(buffer, userId);
  }

  async uploadFamilyPhoto(buffer: Buffer, familyId: string): Promise<UploadResult> {
    return this.cloudinaryService.uploadFamilyPhoto(buffer, familyId);
  }

  async uploadMemberAvatar(buffer: Buffer, memberId: string): Promise<UploadResult> {
    return this.cloudinaryService.uploadMemberAvatar(buffer, memberId);
  }

  async uploadTimeline(buffer: Buffer, familyId: string): Promise<UploadResult> {
    return this.cloudinaryService.uploadTimeline(buffer, familyId);
  }

  async uploadMemory(buffer: Buffer, familyId: string): Promise<UploadResult> {
    return this.cloudinaryService.uploadMemory(buffer, familyId);
  }

  async deleteImage(secureUrl: string | null | undefined): Promise<void> {
    if (!secureUrl) return;

    const publicId = this.cloudinaryService.extractPublicIdFromUrl(secureUrl);
    if (publicId) {
      await this.cloudinaryService.deleteByPublicId(publicId);
    }
  }

  async replaceImage(
    oldUrl: string | null | undefined,
    buffer: Buffer,
    uploadFn: (buffer: Buffer) => Promise<UploadResult>,
  ): Promise<UploadResult> {
    if (oldUrl) {
      await this.deleteImage(oldUrl);
    }
    return uploadFn(buffer);
  }

  generateSignedUrl(publicId: string, expiresIn?: number): string {
    return this.cloudinaryService.generateSignedUrl(publicId, expiresIn);
  }

  async uploadEventMediaFiles(files: Express.Multer.File[], eventId: string) {
    const results = [];
    for (const file of files) {
      const buffer = this.validateAndPrepare(file);
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');

      let uploadResult;
      if (isImage) {
        uploadResult = await this.cloudinaryService.uploadImage(buffer, 'timeline');
      } else if (isVideo) {
        uploadResult = await this.cloudinaryService.uploadVideo(buffer, 'timeline');
      } else {
        uploadResult = await this.cloudinaryService.uploadDocument(buffer, 'timeline');
      }

      results.push({
        url: uploadResult.secureUrl,
        thumbnailUrl: isImage ? uploadResult.secureUrl : undefined,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        type: isImage ? 'IMAGE' : isVideo ? 'VIDEO' : 'DOCUMENT',
        width: uploadResult.width,
        height: uploadResult.height,
      });
    }
    return results;
  }

  async uploadEventDocumentFiles(files: Express.Multer.File[], eventId: string) {
    const results = [];
    for (const file of files) {
      const buffer = this.validateAndPrepare(file);
      const isImage = file.mimetype.startsWith('image/');

      let uploadResult;
      if (isImage) {
        uploadResult = await this.cloudinaryService.uploadImage(buffer, 'documents');
      } else {
        uploadResult = await this.cloudinaryService.uploadDocument(buffer, 'documents');
      }

      results.push({
        fileUrl: uploadResult.secureUrl,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        thumbnailUrl: isImage ? uploadResult.secureUrl : undefined,
      });
    }
    return results;
  }

  async uploadGeneric(file: Express.Multer.File) {
    const buffer = this.validateAndPrepare(file);
    const isImage = file.mimetype.startsWith('image/');

    const uploadResult = isImage
      ? await this.cloudinaryService.uploadImage(buffer, 'timeline')
      : await this.cloudinaryService.uploadDocument(buffer, 'timeline');

    return {
      url: uploadResult.secureUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      type: isImage ? 'IMAGE' : 'DOCUMENT',
    };
  }

  private async userIsFamilyMember(userId: string, familyId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const family = await this.prisma.family.findFirst({
      where: {
        id: familyId,
        OR: [
          { ownerId: userId },
          ...(user?.email
            ? [
                {
                  members: {
                    some: { email: { equals: user.email, mode: 'insensitive' as const } },
                  },
                },
              ]
            : []),
        ],
      },
      select: { id: true },
    });
    return !!family;
  }

  private async assertOwnsUrl(url: string, userId: string): Promise<void> {
    const [ownedByUser, userRecord] = await Promise.all([
      this.prisma.user.findFirst({
        where: { OR: [{ avatar: url }, { coverPhoto: url }] },
        select: { id: true },
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    ]);
    if (ownedByUser) {
      if (ownedByUser.id === userId) return;
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    const familyMember = await this.prisma.familyMember.findFirst({
      where: { avatar: url, deletedAt: null },
      select: { familyId: true },
    });
    if (familyMember) {
      const isMember = await this.userIsFamilyMember(userId, familyMember.familyId);
      if (isMember) return;
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    const eventMedia = await this.prisma.eventMedia.findFirst({
      where: { OR: [{ url }, { thumbnailUrl: url }] },
      select: {
        uploadedById: true,
        event: { select: { createdById: true, familyId: true, clanId: true } },
      },
    });
    if (eventMedia) {
      if (eventMedia.uploadedById === userId) return;
      const e = eventMedia.event;
      if (e.createdById === userId) return;
      if (e.familyId && (await this.userIsFamilyMember(userId, e.familyId))) return;
      if (e.clanId) {
        const clan = await this.prisma.clan.findUnique({
          where: { id: e.clanId },
          select: { ownerId: true },
        });
        if (clan?.ownerId === userId) return;
      }
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    const memoryMedia = await this.prisma.memoryMedia.findFirst({
      where: { OR: [{ url }, { alt: url }] },
      select: { memory: { select: { userId: true, familyId: true } } },
    });
    if (memoryMedia) {
      if (memoryMedia.memory.userId === userId) return;
      if (await this.userIsFamilyMember(userId, memoryMedia.memory.familyId)) return;
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    const eventDocument = await this.prisma.eventDocument.findFirst({
      where: { OR: [{ fileUrl: url }, { thumbnailUrl: url }, { originalUrl: url }] },
      select: { uploadedById: true, ownerId: true, event: { select: { createdById: true } } },
    });
    if (eventDocument) {
      if (eventDocument.uploadedById === userId || eventDocument.ownerId === userId) return;
      if (eventDocument.event?.createdById === userId) return;
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    const vaultDoc = await this.prisma.documentVault.findFirst({
      where: { storageUrl: url },
      select: { ownerId: true, uploaderId: true },
    });
    if (vaultDoc) {
      if (vaultDoc.ownerId === userId || vaultDoc.uploaderId === userId) return;
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    throw new ForbiddenException('File not found or you do not have permission to delete it');
  }

  async deleteFile(url: string, userId: string) {
    try {
      const publicId = this.cloudinaryService.extractPublicIdFromUrl(url);
      if (!publicId) {
        return { success: false, error: 'Could not extract public ID from URL' };
      }
      await this.assertOwnsUrl(url, userId);
      await this.cloudinaryService.deleteByPublicId(publicId);
      return { success: true };
    } catch (error: any) {
      if (error instanceof ForbiddenException) throw error;
      return { success: false, error: error.message };
    }
  }
}
