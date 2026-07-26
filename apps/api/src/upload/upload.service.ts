import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { CloudinaryService, ImageCategory, UploadResult } from '../cloudinary/cloudinary.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

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

  async deleteFile(url: string) {
    try {
      const publicId = this.cloudinaryService.extractPublicIdFromUrl(url);
      if (!publicId) {
        return { success: false, error: 'Could not extract public ID from URL' };
      }
      await this.cloudinaryService.deleteByPublicId(publicId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
