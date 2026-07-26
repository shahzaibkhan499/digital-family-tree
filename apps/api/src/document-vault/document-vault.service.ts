import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CreateShareDto } from './dto/create-share.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class DocumentVaultService {
  private readonly logger = new Logger(DocumentVaultService.name);

  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
  ) {}

  async createDocument(userId: string, dto: CreateDocumentDto) {
    const displayId = await this.identityService.generateDocumentVaultId();
    const doc = await this.prisma.documentVault.create({
      data: {
        displayId,
        title: dto.title,
        description: dto.description,
        documentType: dto.documentType || 'OTHER',
        ownerId: userId,
        ownerType: dto.ownerType || 'USER',
        uploaderId: userId,
        originalFileName: dto.originalFileName,
        storageProvider: dto.storageProvider || 'cloudinary',
        storageUrl: dto.storageUrl,
        mimeType: dto.mimeType,
        extension: dto.extension,
        fileSize: dto.fileSize,
        pages: dto.pages,
        language: dto.language,
        country: dto.country,
        city: dto.city,
        historicalDate: dto.historicalDate ? new Date(dto.historicalDate) : null,
        documentDate: dto.documentDate ? new Date(dto.documentDate) : null,
        visibility: dto.visibility || 'ONLY_ME',
        tags: dto.tags,
        keywords: dto.keywords,
        references: dto.references,
        source: dto.source,
        familyId: dto.familyId,
        subClanId: dto.subClanId,
        clanId: dto.clanId,
        communityId: dto.communityId,
        folderId: dto.folderId,
      },
    });

    await this.prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        versionNumber: 1,
        title: dto.title,
        description: dto.description,
        storageUrl: dto.storageUrl,
        originalFileName: dto.originalFileName,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        changeNotes: 'Initial version',
        uploadedById: userId,
      },
    });

    return doc;
  }

  async findAllByOwner(userId: string, query: {
    documentType?: string;
    visibility?: string;
    verificationStatus?: string;
    familyId?: string;
    clanId?: string;
    communityId?: string;
    folderId?: string;
    isFavorite?: string;
    search?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const page = parseInt(query.page || '1');
    const limit = Math.min(parseInt(query.limit || '20'), 100);
    const skip = (page - 1) * limit;

    const where: any = { ownerId: userId, deletedAt: null };
    if (query.documentType) where.documentType = query.documentType;
    if (query.visibility) where.visibility = query.visibility;
    if (query.verificationStatus) where.verificationStatus = query.verificationStatus;
    if (query.familyId) where.familyId = query.familyId;
    if (query.clanId) where.clanId = query.clanId;
    if (query.communityId) where.communityId = query.communityId;
    if (query.folderId) where.folderId = query.folderId;
    if (query.isFavorite === 'true') where.isFavorite = true;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { contains: query.search, mode: 'insensitive' } },
        { keywords: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [sortBy]: sortOrder };

    const [documents, total] = await Promise.all([
      this.prisma.documentVault.findMany({
        where,
        include: { folder: true, versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.documentVault.count({ where }),
    ]);

    return {
      documents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId?: string) {
    const doc = await this.prisma.documentVault.findUnique({
      where: { id },
      include: {
        folder: true,
        versions: { orderBy: { versionNumber: 'desc' } },
        shares: userId ? { where: { sharedWithId: userId, isRevoked: false } } : undefined,
        owner: { select: { id: true, name: true, avatar: true } },
        uploader: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!doc) throw new NotFoundException('Document not found');

    if (userId && doc.ownerId !== userId) {
      if (doc.visibility === 'ONLY_ME') {
        const hasShare = doc.shares && doc.shares.length > 0;
        if (!hasShare) throw new ForbiddenException('Access denied');
      }
      await this.logAccess(doc.id, userId, 'VIEW');
    }

    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto, userId: string) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.ownerId !== userId) throw new ForbiddenException('Only the owner can update');

    const data: any = { ...dto };
    if (dto.historicalDate) data.historicalDate = new Date(dto.historicalDate);
    if (dto.documentDate) data.documentDate = new Date(dto.documentDate);

    return this.prisma.documentVault.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.ownerId !== userId) throw new ForbiddenException('Only the owner can delete');

    return this.prisma.documentVault.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string, userId: string) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.ownerId !== userId) throw new ForbiddenException('Only the owner can restore');

    return this.prisma.documentVault.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async permanentlyDelete(id: string, userId: string) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.ownerId !== userId) throw new ForbiddenException('Only the owner can permanently delete');

    return this.prisma.documentVault.delete({ where: { id } });
  }

  async toggleFavorite(id: string, userId: string) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.ownerId !== userId) throw new ForbiddenException('Only the owner can favorite');

    return this.prisma.documentVault.update({
      where: { id },
      data: { isFavorite: !doc.isFavorite },
    });
  }

  async getStats(userId: string) {
    const [totalDocuments, totalSize, typeBreakdown, favoriteCount, recentCount, verificationBreakdown] = await Promise.all([
      this.prisma.documentVault.count({ where: { ownerId: userId, deletedAt: null } }),
      this.prisma.documentVault.aggregate({ where: { ownerId: userId, deletedAt: null }, _sum: { fileSize: true } }),
      this.prisma.documentVault.groupBy({ by: ['documentType'], where: { ownerId: userId, deletedAt: null }, _count: true }),
      this.prisma.documentVault.count({ where: { ownerId: userId, deletedAt: null, isFavorite: true } }),
      this.prisma.documentVault.count({ where: { ownerId: userId, deletedAt: null, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      this.prisma.documentVault.groupBy({ by: ['verificationStatus'], where: { ownerId: userId, deletedAt: null }, _count: true }),
    ]);

    return {
      totalDocuments,
      totalSizeBytes: totalSize._sum.fileSize || 0,
      totalSizeMB: Math.round(((totalSize._sum.fileSize || 0) / (1024 * 1024)) * 100) / 100,
      typeBreakdown: typeBreakdown.map(t => ({ type: t.documentType, count: t._count })),
      favoriteCount,
      recentCount,
      verificationBreakdown: verificationBreakdown.map(v => ({ status: v.verificationStatus, count: v._count })),
    };
  }

  async getDeleted(userId: string) {
    return this.prisma.documentVault.findMany({
      where: { ownerId: userId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async getSharedWithMe(userId: string) {
    return this.prisma.documentShare.findMany({
      where: { sharedWithId: userId, isRevoked: false },
      include: { document: true, sharedBy: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecent(userId: string, limit = 10) {
    return this.prisma.documentVault.findMany({
      where: { ownerId: userId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async search(userId: string, query: string) {
    return this.prisma.documentVault.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { contains: query, mode: 'insensitive' } },
          { keywords: { contains: query, mode: 'insensitive' } },
          { originalFileName: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // === VERSIONING ===

  async createVersion(documentId: string, userId: string, dto: CreateVersionDto) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.ownerId !== userId) throw new ForbiddenException('Only the owner can version');

    const nextVersion = doc.currentVersion + 1;

    const version = await this.prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: nextVersion,
        title: dto.title || doc.title,
        description: dto.description,
        storageUrl: dto.storageUrl,
        originalFileName: dto.originalFileName,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        changeNotes: dto.changeNotes,
        uploadedById: userId,
      },
    });

    await this.prisma.documentVault.update({
      where: { id: documentId },
      data: { currentVersion: nextVersion },
    });

    return version;
  }

  async getVersions(documentId: string) {
    return this.prisma.documentVersion.findMany({
      where: { documentId },
      include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async restoreVersion(documentId: string, versionNumber: number, userId: string) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.ownerId !== userId) throw new ForbiddenException('Only the owner can restore versions');

    const version = await this.prisma.documentVersion.findUnique({
      where: { documentId_versionNumber: { documentId, versionNumber } },
    });
    if (!version) throw new NotFoundException('Version not found');

    return this.prisma.documentVault.update({
      where: { id: documentId },
      data: {
        title: version.title || doc.title,
        description: version.description || doc.description,
        storageUrl: version.storageUrl || doc.storageUrl,
        originalFileName: version.originalFileName || doc.originalFileName,
        mimeType: version.mimeType || doc.mimeType,
        fileSize: version.fileSize || doc.fileSize,
      },
    });
  }

  // === FOLDERS ===

  async createFolder(userId: string, dto: CreateFolderDto) {
    const displayId = await this.identityService.generateDocumentFolderId();
    return this.prisma.documentFolder.create({
      data: {
        displayId,
        name: dto.name,
        description: dto.description,
        ownerId: userId,
        parentId: dto.parentId,
        familyId: dto.familyId,
        clanId: dto.clanId,
        communityId: dto.communityId,
        subClanId: dto.subClanId,
        color: dto.color,
        icon: dto.icon,
      },
    });
  }

  async getFolders(userId: string, query?: { familyId?: string; clanId?: string; communityId?: string; parentId?: string }) {
    const where: any = { ownerId: userId };
    if (query?.familyId) where.familyId = query.familyId;
    if (query?.clanId) where.clanId = query.clanId;
    if (query?.communityId) where.communityId = query.communityId;
    if (query?.parentId) where.parentId = query.parentId;
    else if (!query?.parentId && query?.parentId !== 'null') where.parentId = null;

    return this.prisma.documentFolder.findMany({
      where,
      include: { _count: { select: { documents: true, children: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getFolder(id: string, userId: string) {
    const folder = await this.prisma.documentFolder.findUnique({
      where: { id },
      include: {
        children: { include: { _count: { select: { documents: true } } } },
        documents: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        parent: true,
      },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.ownerId !== userId) throw new ForbiddenException('Access denied');
    return folder;
  }

  async updateFolder(id: string, userId: string, data: { name?: string; description?: string; color?: string; icon?: string }) {
    const folder = await this.prisma.documentFolder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.ownerId !== userId) throw new ForbiddenException('Only the owner can update');

    return this.prisma.documentFolder.update({ where: { id }, data });
  }

  async deleteFolder(id: string, userId: string) {
    const folder = await this.prisma.documentFolder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.ownerId !== userId) throw new ForbiddenException('Only the owner can delete');
    if (folder.isSystem) throw new BadRequestException('Cannot delete system folder');

    await this.prisma.documentVault.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });

    return this.prisma.documentFolder.delete({ where: { id } });
  }

  // === SHARING ===

  async createShare(userId: string, dto: CreateShareDto) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id: dto.documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.ownerId !== userId) throw new ForbiddenException('Only the owner can share');

    const secureToken = dto.shareType === 'LINK' ? randomBytes(32).toString('hex') : null;
    let passwordHash = null;
    if (dto.password) {
      const bcrypt = await import('bcryptjs');
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.documentShare.create({
      data: {
        documentId: dto.documentId,
        sharedById: userId,
        sharedWithId: dto.sharedWithId,
        shareType: dto.shareType || 'USER',
        permission: dto.permission || 'VIEW',
        secureToken,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        passwordHash,
        isDownloadAllowed: dto.isDownloadAllowed || false,
        maxDownloads: dto.maxDownloads,
      },
    });
  }

  async getShares(documentId: string, userId: string) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.ownerId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.documentShare.findMany({
      where: { documentId },
      include: { sharedBy: { select: { id: true, name: true } }, sharedWith: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async accessViaToken(token: string) {
    const share = await this.prisma.documentShare.findUnique({
      where: { secureToken: token },
      include: { document: true },
    });
    if (!share) throw new NotFoundException('Invalid share link');
    if (share.isRevoked) throw new ForbiddenException('Share link has been revoked');
    if (share.expiresAt && share.expiresAt < new Date()) throw new ForbiddenException('Share link has expired');
    if (share.maxDownloads && share.downloadCount >= share.maxDownloads) throw new ForbiddenException('Download limit reached');

    await this.prisma.documentShare.update({
      where: { id: share.id },
      data: { accessCount: { increment: 1 }, lastAccessedAt: new Date() },
    });

    return share.document;
  }

  async revokeShare(id: string, userId: string) {
    const share = await this.prisma.documentShare.findUnique({ where: { id } });
    if (!share) throw new NotFoundException('Share not found');
    if (share.sharedById !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.documentShare.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  // === ACCESS LOGS ===

  async getAccessLogs(documentId: string, userId: string) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.ownerId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.documentAccessLog.findMany({
      where: { documentId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  private async logAccess(documentId: string, userId: string, action: string) {
    try {
      await this.prisma.documentAccessLog.create({
        data: { documentId, userId, action },
      });
    } catch (e: any) {
      this.logger.warn(`Failed to log access: ${e.message}`);
    }
  }

  // === COLLECTIONS ===

  async createCollection(userId: string, dto: any) {
    const displayId = await this.identityService.generateDocumentCollectionId();
    return this.prisma.documentCollection.create({
      data: {
        displayId,
        name: dto.name,
        description: dto.description,
        collectionType: dto.collectionType || 'MANUAL',
        ownerId: userId,
        visibility: dto.visibility || 'ONLY_ME',
        coverImage: dto.coverImage,
        isFeatured: dto.isFeatured || false,
        sortOrder: dto.sortOrder || 0,
        familyId: dto.familyId,
        clanId: dto.clanId,
        communityId: dto.communityId,
        subClanId: dto.subClanId,
      },
    });
  }

  async getCollections(userId: string, query?: any) {
    const where: any = { ownerId: userId };
    if (query?.collectionType) where.collectionType = query.collectionType;
    if (query?.visibility) where.visibility = query.visibility;
    if (query?.familyId) where.familyId = query.familyId;
    if (query?.clanId) where.clanId = query.clanId;
    if (query?.communityId) where.communityId = query.communityId;
    if (query?.isFeatured === 'true') where.isFeatured = true;

    return this.prisma.documentCollection.findMany({
      where,
      include: { _count: { select: { items: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getCollection(id: string, userId: string) {
    const collection = await this.prisma.documentCollection.findUnique({
      where: { id },
      include: {
        items: {
          include: { document: { include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.ownerId !== userId) throw new ForbiddenException('Access denied');
    return collection;
  }

  async updateCollection(id: string, userId: string, data: any) {
    const collection = await this.prisma.documentCollection.findUnique({ where: { id } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.ownerId !== userId) throw new ForbiddenException('Only the owner can update');
    return this.prisma.documentCollection.update({ where: { id }, data });
  }

  async deleteCollection(id: string, userId: string) {
    const collection = await this.prisma.documentCollection.findUnique({ where: { id } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.ownerId !== userId) throw new ForbiddenException('Only the owner can delete');
    return this.prisma.documentCollection.delete({ where: { id } });
  }

  async addToCollection(collectionId: string, userId: string, documentId: string, note?: string) {
    const collection = await this.prisma.documentCollection.findUnique({ where: { id: collectionId } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.ownerId !== userId) throw new ForbiddenException('Access denied');

    const item = await this.prisma.documentCollectionItem.create({
      data: {
        collectionId,
        documentId,
        addedById: userId,
        note,
        sortOrder: collection.itemCount,
      },
    });

    await this.prisma.documentCollection.update({
      where: { id: collectionId },
      data: { itemCount: { increment: 1 } },
    });

    return item;
  }

  async removeFromCollection(collectionId: string, itemId: string, userId: string) {
    const collection = await this.prisma.documentCollection.findUnique({ where: { id: collectionId } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.ownerId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.documentCollectionItem.delete({ where: { id: itemId } });
    await this.prisma.documentCollection.update({
      where: { id: collectionId },
      data: { itemCount: { decrement: 1 } },
    });

    return { success: true };
  }

  // === ATTACHMENTS ===

  async createAttachment(userId: string, dto: any) {
    return this.prisma.documentAttachment.create({
      data: {
        documentId: dto.documentId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        attachmentType: dto.attachmentType || 'PRIMARY',
        description: dto.description,
        isPrimary: dto.isPrimary || false,
        createdBy: userId,
      },
    });
  }

  async getAttachments(entityType: string, entityId: string) {
    return this.prisma.documentAttachment.findMany({
      where: { entityType, entityId },
      include: { document: { select: { id: true, displayId: true, title: true, documentType: true, mimeType: true, fileSize: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeAttachment(id: string, userId: string) {
    const attachment = await this.prisma.documentAttachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException('Attachment not found');
    if (attachment.createdBy !== userId) throw new ForbiddenException('Access denied');
    return this.prisma.documentAttachment.delete({ where: { id } });
  }

  // === VERIFICATIONS ===

  async createVerification(userId: string, dto: any) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id: dto.documentId } });
    if (!doc) throw new NotFoundException('Document not found');

    const verification = await this.prisma.documentVerification.create({
      data: {
        documentId: dto.documentId,
        verifierId: userId,
        verificationType: dto.verificationType || 'COMMUNITY',
        confidence: dto.confidence,
        notes: dto.notes,
        evidence: dto.evidence,
        isOfficial: dto.isOfficial || false,
      },
    });

    if (dto.confidence && dto.confidence >= 80) {
      await this.prisma.documentVault.update({
        where: { id: dto.documentId },
        data: { verificationStatus: 'VERIFIED' },
      });
    } else if (dto.confidence && dto.confidence >= 50) {
      await this.prisma.documentVault.update({
        where: { id: dto.documentId },
        data: { verificationStatus: 'PARTIAL' },
      });
    }

    return verification;
  }

  async getVerifications(documentId: string) {
    return this.prisma.documentVerification.findMany({
      where: { documentId },
      include: { verifier: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewVerification(id: string, userId: string, status: string, notes?: string) {
    const verification = await this.prisma.documentVerification.findUnique({ where: { id } });
    if (!verification) throw new NotFoundException('Verification not found');

    return this.prisma.documentVerification.update({
      where: { id },
      data: {
        status,
        notes: notes || verification.notes,
        verifiedAt: status === 'APPROVED' ? new Date() : null,
      },
    });
  }

  // === GALLERY ===

  async createGallery(userId: string, dto: any) {
    const displayId = await this.identityService.generateDocumentGalleryId();
    return this.prisma.documentGallery.create({
      data: {
        displayId,
        title: dto.title,
        description: dto.description,
        galleryType: dto.galleryType || 'PHOTO',
        ownerId: userId,
        albumName: dto.albumName,
        coverImage: dto.coverImage,
        visibility: dto.visibility || 'ONLY_ME',
        familyId: dto.familyId,
        clanId: dto.clanId,
        communityId: dto.communityId,
        subClanId: dto.subClanId,
        historicalDate: dto.historicalDate ? new Date(dto.historicalDate) : null,
        location: dto.location,
        photographer: dto.photographer,
        tags: dto.tags,
      },
    });
  }

  async getGalleries(userId: string, query?: any) {
    const where: any = { ownerId: userId };
    if (query?.galleryType) where.galleryType = query.galleryType;
    if (query?.visibility) where.visibility = query.visibility;
    if (query?.albumName) where.albumName = query.albumName;
    if (query?.familyId) where.familyId = query.familyId;
    if (query?.clanId) where.clanId = query.clanId;
    if (query?.communityId) where.communityId = query.communityId;

    return this.prisma.documentGallery.findMany({
      where,
      include: { _count: { select: { references: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGallery(id: string, userId: string) {
    const gallery = await this.prisma.documentGallery.findUnique({
      where: { id },
      include: {
        references: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!gallery) throw new NotFoundException('Gallery not found');
    if (gallery.ownerId !== userId) throw new ForbiddenException('Access denied');
    await this.prisma.documentGallery.update({ where: { id }, data: { totalViews: { increment: 1 } } });
    return gallery;
  }

  async updateGallery(id: string, userId: string, data: any) {
    const gallery = await this.prisma.documentGallery.findUnique({ where: { id } });
    if (!gallery) throw new NotFoundException('Gallery not found');
    if (gallery.ownerId !== userId) throw new ForbiddenException('Only the owner can update');
    if (data.historicalDate) data.historicalDate = new Date(data.historicalDate);
    return this.prisma.documentGallery.update({ where: { id }, data });
  }

  async deleteGallery(id: string, userId: string) {
    const gallery = await this.prisma.documentGallery.findUnique({ where: { id } });
    if (!gallery) throw new NotFoundException('Gallery not found');
    if (gallery.ownerId !== userId) throw new ForbiddenException('Only the owner can delete');
    return this.prisma.documentGallery.delete({ where: { id } });
  }

  // === REFERENCES ===

  async createReference(userId: string, dto: any) {
    return this.prisma.documentReference.create({
      data: {
        documentId: dto.documentId,
        galleryId: dto.galleryId,
        referenceType: dto.referenceType || 'SOURCE_CITATION',
        title: dto.title,
        author: dto.author,
        publishDate: dto.publishDate ? new Date(dto.publishDate) : null,
        publisher: dto.publisher,
        url: dto.url,
        isbn: dto.isbn,
        doi: dto.doi,
        journalName: dto.journalName,
        volume: dto.volume,
        issue: dto.issue,
        pages: dto.pages,
        accessDate: dto.accessDate ? new Date(dto.accessDate) : null,
        reliability: dto.reliability || 'UNCHECKED',
        notes: dto.notes,
        createdBy: userId,
      },
    });
  }

  async getReferences(userId: string, query?: any) {
    const where: any = { createdBy: userId };
    if (query?.documentId) where.documentId = query.documentId;
    if (query?.galleryId) where.galleryId = query.galleryId;
    if (query?.referenceType) where.referenceType = query.referenceType;
    if (query?.reliability) where.reliability = query.reliability;

    return this.prisma.documentReference.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReference(id: string, userId: string, data: any) {
    const ref = await this.prisma.documentReference.findUnique({ where: { id } });
    if (!ref) throw new NotFoundException('Reference not found');
    if (ref.createdBy !== userId) throw new ForbiddenException('Only the creator can update');
    return this.prisma.documentReference.update({ where: { id }, data });
  }

  async deleteReference(id: string, userId: string) {
    const ref = await this.prisma.documentReference.findUnique({ where: { id } });
    if (!ref) throw new NotFoundException('Reference not found');
    if (ref.createdBy !== userId) throw new ForbiddenException('Only the creator can delete');
    return this.prisma.documentReference.delete({ where: { id } });
  }

  // === PUBLIC PAGES ===

  async createPublicPage(userId: string, dto: any) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id: dto.documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.ownerId !== userId) throw new ForbiddenException('Only the owner can publish');
    if (doc.visibility === 'ONLY_ME') throw new BadRequestException('Cannot publish a private document');

    return this.prisma.documentPublicPage.create({
      data: {
        documentId: dto.documentId,
        slug: dto.slug,
        title: dto.title,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        ogImage: dto.ogImage,
        isPublished: dto.isPublished || false,
        allowDownload: dto.allowDownload || false,
        allowComments: dto.allowComments !== false,
        template: dto.template || 'DEFAULT',
      },
    });
  }

  async getPublicPage(slug: string) {
    const page = await this.prisma.documentPublicPage.findUnique({
      where: { slug },
      include: {
        document: {
          select: {
            id: true, displayId: true, title: true, description: true,
            documentType: true, mimeType: true, storageUrl: true,
            fileSize: true, tags: true, keywords: true,
            owner: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });
    if (!page || !page.isPublished) throw new NotFoundException('Page not found');
    await this.prisma.documentPublicPage.update({
      where: { id: page.id },
      data: { viewCount: { increment: 1 } },
    });
    return page;
  }

  async getMyPublicPages(userId: string) {
    return this.prisma.documentPublicPage.findMany({
      where: { document: { ownerId: userId } },
      include: { document: { select: { id: true, displayId: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePublicPage(id: string, userId: string, data: any) {
    const page = await this.prisma.documentPublicPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Public page not found');
    const doc = await this.prisma.documentVault.findUnique({ where: { id: page.documentId } });
    if (!doc || doc.ownerId !== userId) throw new ForbiddenException('Access denied');
    return this.prisma.documentPublicPage.update({ where: { id }, data });
  }

  async deletePublicPage(id: string, userId: string) {
    const page = await this.prisma.documentPublicPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Public page not found');
    const doc = await this.prisma.documentVault.findUnique({ where: { id: page.documentId } });
    if (!doc || doc.ownerId !== userId) throw new ForbiddenException('Access denied');
    return this.prisma.documentPublicPage.delete({ where: { id } });
  }

  // === KNOWLEDGE BASE ===

  async createKnowledgeBaseEntry(userId: string, dto: any) {
    const displayId = await this.identityService.generateDocumentKnowledgeBaseId();
    return this.prisma.documentKnowledgeBase.create({
      data: {
        displayId,
        title: dto.title,
        content: dto.content,
        articleType: dto.articleType || 'WIKI',
        ownerId: userId,
        collectionId: dto.collectionId,
        galleryId: dto.galleryId,
        status: dto.status || 'DRAFT',
        visibility: dto.visibility || 'ONLY_ME',
        tags: dto.tags,
        familyId: dto.familyId,
        clanId: dto.clanId,
        communityId: dto.communityId,
      },
    });
  }

  async getKnowledgeBaseEntries(userId: string, query?: any) {
    const where: any = { ownerId: userId };
    if (query?.articleType) where.articleType = query.articleType;
    if (query?.status) where.status = query.status;
    if (query?.visibility) where.visibility = query.visibility;
    if (query?.collectionId) where.collectionId = query.collectionId;
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
        { tags: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.documentKnowledgeBase.findMany({
      where,
      include: {
        collection: { select: { id: true, name: true } },
        gallery: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getKnowledgeBaseEntry(id: string, userId: string) {
    const entry = await this.prisma.documentKnowledgeBase.findUnique({
      where: { id },
      include: {
        collection: true,
        gallery: true,
        owner: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!entry) throw new NotFoundException('Knowledge base entry not found');
    if (entry.ownerId !== userId) throw new ForbiddenException('Access denied');
    await this.prisma.documentKnowledgeBase.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return entry;
  }

  async updateKnowledgeBaseEntry(id: string, userId: string, data: any) {
    const entry = await this.prisma.documentKnowledgeBase.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Knowledge base entry not found');
    if (entry.ownerId !== userId) throw new ForbiddenException('Only the owner can update');
    return this.prisma.documentKnowledgeBase.update({ where: { id }, data });
  }

  async deleteKnowledgeBaseEntry(id: string, userId: string) {
    const entry = await this.prisma.documentKnowledgeBase.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Knowledge base entry not found');
    if (entry.ownerId !== userId) throw new ForbiddenException('Only the owner can delete');
    return this.prisma.documentKnowledgeBase.delete({ where: { id } });
  }

  async voteKnowledgeBase(id: string, helpful: boolean) {
    const entry = await this.prisma.documentKnowledgeBase.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Knowledge base entry not found');
    return this.prisma.documentKnowledgeBase.update({
      where: { id },
      data: helpful ? { helpfulCount: { increment: 1 } } : { notHelpfulCount: { increment: 1 } },
    });
  }

  // === ANALYTICS & PRODUCT FEATURES ===

  async getTrending(userId: string, limit = 10) {
    return this.prisma.documentVault.findMany({
      where: { ownerId: userId, deletedAt: null, visibility: { not: 'ONLY_ME' } },
      orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });
  }

  async getFeatured(userId: string, limit = 10) {
    return this.prisma.documentVault.findMany({
      where: { ownerId: userId, deletedAt: null, isFavorite: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async getMostViewed(userId: string, limit = 10) {
    return this.prisma.documentVault.findMany({
      where: { ownerId: userId, deletedAt: null },
      orderBy: { currentVersion: 'desc' },
      take: limit,
    });
  }

  async getVerified(userId: string, limit = 20) {
    return this.prisma.documentVault.findMany({
      where: { ownerId: userId, deletedAt: null, verificationStatus: 'VERIFIED' },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async getStorageAnalytics(userId: string) {
    const [totalSize, typeBreakdown, mimeTypeBreakdown, monthlyUploads] = await Promise.all([
      this.prisma.documentVault.aggregate({ where: { ownerId: userId, deletedAt: null }, _sum: { fileSize: true }, _count: true }),
      this.prisma.documentVault.groupBy({ by: ['documentType'], where: { ownerId: userId, deletedAt: null }, _sum: { fileSize: true }, _count: true }),
      this.prisma.documentVault.groupBy({ by: ['mimeType'], where: { ownerId: userId, deletedAt: null }, _sum: { fileSize: true }, _count: true }),
      this.prisma.$queryRaw`SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*)::int as count FROM "DocumentVault" WHERE "ownerId" = ${userId} AND "deletedAt" IS NULL GROUP BY DATE_TRUNC('month', "createdAt") ORDER BY month DESC LIMIT 12`,
    ]);

    return {
      totalSizeBytes: totalSize._sum.fileSize || 0,
      totalDocuments: totalSize._count || 0,
      typeBreakdown: typeBreakdown.map(t => ({ type: t.documentType, count: t._count, size: t._sum.fileSize || 0 })),
      mimeTypeBreakdown: mimeTypeBreakdown.map(m => ({ mimeType: m.mimeType, count: m._count, size: m._sum.fileSize || 0 })),
      monthlyUploads,
    };
  }

  // === TIMELINE INTEGRATION ===

  async getTimelineDocuments(entityType: string, entityId: string, userId: string) {
    const where: any = { deletedAt: null };
    
    if (entityType === 'family') where.familyId = entityId;
    else if (entityType === 'clan') where.clanId = entityId;
    else if (entityType === 'community') where.communityId = entityId;
    else if (entityType === 'member') {
      where.attachments = { some: { entityType: 'MEMBER', entityId } };
    }

    const documents = await this.prisma.documentVault.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        verifications: { select: { verificationType: true, status: true, confidence: true } },
        _count: { select: { collectionItems: true, attachments: true } },
      },
      orderBy: [
        { documentDate: 'desc' },
        { historicalDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return documents.map(doc => ({
      id: doc.id,
      displayId: doc.displayId,
      title: doc.title,
      description: doc.description,
      documentType: doc.documentType,
      historicalDate: doc.historicalDate,
      documentDate: doc.documentDate,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      verificationStatus: doc.verificationStatus,
      isFavorite: doc.isFavorite,
      tags: doc.tags,
      owner: doc.owner,
      verificationCount: doc.verifications.length,
      collectionCount: doc._count.collectionItems,
      attachmentCount: doc._count.attachments,
      createdAt: doc.createdAt,
    }));
  }

  // === SMART ORGANIZATION ===

  async autoTagDocument(documentId: string, userId: string) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.ownerId !== userId) throw new ForbiddenException('Access denied');

    const existingTags = doc.tags ? doc.tags.split(',').map(t => t.trim()) : [];
    const autoTags: string[] = [];

    if (doc.documentType) autoTags.push(doc.documentType.toLowerCase());
    if (doc.country) autoTags.push(doc.country.toLowerCase());
    if (doc.city) autoTags.push(doc.city.toLowerCase());
    if (doc.language) autoTags.push(doc.language.toLowerCase());
    if (doc.mimeType) {
      if (doc.mimeType.startsWith('image/')) autoTags.push('image');
      else if (doc.mimeType.startsWith('video/')) autoTags.push('video');
      else if (doc.mimeType.startsWith('audio/')) autoTags.push('audio');
      else if (doc.mimeType === 'application/pdf') autoTags.push('pdf');
    }
    if (doc.historicalDate) {
      const year = doc.historicalDate.getFullYear();
      const decade = Math.floor(year / 10) * 10;
      autoTags.push(`${decade}s`);
      autoTags.push(`century-${Math.ceil(year / 100)}`);
    }
    if (doc.pages && doc.pages > 50) autoTags.push('long-document');
    if (doc.fileSize && doc.fileSize > 10 * 1024 * 1024) autoTags.push('large-file');

    const allTags = [...new Set([...existingTags, ...autoTags])];

    return this.prisma.documentVault.update({
      where: { id: documentId },
      data: { tags: allTags.join(', ') },
    });
  }

  async getOrganizationSuggestions(userId: string) {
    const documents = await this.prisma.documentVault.findMany({
      where: { ownerId: userId, deletedAt: null },
      include: {
        folder: true,
        collectionItems: true,
        _count: { select: { tagsEntries: true } },
      },
    });

    const suggestions: any[] = [];

    const untagged = documents.filter(d => !d.tags || d.tags.trim() === '');
    if (untagged.length > 0) {
      suggestions.push({
        type: 'AUTO_TAG',
        title: `${untagged.length} documents without tags`,
        description: 'Auto-tagging can help organize your documents',
        documentIds: untagged.map(d => d.id),
        priority: 'MEDIUM',
      });
    }

    const unorganized = documents.filter(d => !d.folderId);
    if (unorganized.length > 0) {
      suggestions.push({
        type: 'MOVE_TO_FOLDER',
        title: `${unorganized.length} documents not in any folder`,
        description: 'Consider organizing these into folders',
        documentIds: unorganized.map(d => d.id),
        priority: 'LOW',
      });
    }

    const uncategorized = documents.filter(d => d.collectionItems.length === 0);
    if (uncategorized.length > 5) {
      suggestions.push({
        type: 'CREATE_COLLECTION',
        title: `${uncategorized.length} documents not in any collection`,
        description: 'Create a collection to group related documents',
        priority: 'LOW',
      });
    }

    const unverified = documents.filter(d => d.verificationStatus === 'UNVERIFIED');
    if (unverified.length > 0) {
      suggestions.push({
        type: 'VERIFY_DOCUMENTS',
        title: `${unverified.length} documents awaiting verification`,
        description: 'Verify documents to increase their credibility',
        documentIds: unverified.map(d => d.id),
        priority: 'HIGH',
      });
    }

    const duplicateTitles = documents.reduce((acc, doc) => {
      const title = doc.title.toLowerCase();
      if (!acc[title]) acc[title] = [];
      acc[title].push(doc.id);
      return acc;
    }, {} as Record<string, string[]>);

    const duplicates = Object.entries(duplicateTitles).filter(([, ids]) => ids.length > 1);
    if (duplicates.length > 0) {
      suggestions.push({
        type: 'POTENTIAL_DUPLICATES',
        title: `${duplicates.length} potential duplicate titles found`,
        description: 'Review documents with similar titles for potential duplicates',
        duplicates: duplicates.map(([title, ids]) => ({ title, documentIds: ids })),
        priority: 'MEDIUM',
      });
    }

    return suggestions;
  }
}
