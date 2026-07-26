import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdentityService {
  constructor(private prisma: PrismaService) {}

  async generateUserId(): Promise<string> {
    return this.generateId('USR');
  }

  async generateFamilyId(): Promise<string> {
    return this.generateId('FAM');
  }

  async generateMemberId(): Promise<string> {
    return this.generateId('MEM');
  }

  async generateRelationshipId(): Promise<string> {
    const num = Date.now().toString(36).slice(-8).toUpperCase();
    return `REL-${num}`;
  }

  async generateNotificationId(): Promise<string> {
    return this.generateId('NOT');
  }

  async generateActivityId(): Promise<string> {
    return this.generateId('ACT');
  }

  async generateMemoryId(): Promise<string> {
    return this.generateId('MRY');
  }

  async generateTimelineEventId(): Promise<string> {
    const num = Date.now().toString(36).slice(-8).toUpperCase();
    return `TLV-${num}`;
  }

  async generateDuplicatePairId(): Promise<string> {
    return this.generateId('DUP');
  }

  async generateMergeSnapshotId(): Promise<string> {
    const num = Date.now().toString(36).slice(-8).toUpperCase();
    return `MRG-${num}`;
  }

  async generateClanId(): Promise<string> {
    return this.generateId('CLN');
  }

  async generateCommunityId(): Promise<string> {
    return this.generateId('CMN');
  }

  async generateSubClanId(): Promise<string> {
    return this.generateId('SCL');
  }

  async generateClanRequestId(): Promise<string> {
    return this.generateId('CRQ');
  }

  async generateClanAdminId(): Promise<string> {
    return this.generateId('CAD');
  }

  async generateClanHistoryEntryId(): Promise<string> {
    return this.generateId('CHE');
  }

  async generateEventInvitationId(): Promise<string> {
    return this.generateId('EIN');
  }

  async generateCommunityAdminId(): Promise<string> {
    return this.generateId('CMD');
  }

  async generateCommunityRequestId(): Promise<string> {
    return this.generateId('CMR');
  }

  async generateProfileSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = base || 'user';
    let counter = 0;

    while (true) {
      const existing = await this.prisma.user.findUnique({
        where: { profileSlug: slug },
        select: { id: true },
      });
      if (!existing) return slug;
      counter++;
      slug = `${base}-${counter}`;
    }
  }

  async generateCommunityHistoryId(): Promise<string> {
    return this.generateId('CHI');
  }

  async generateCommunityGalleryId(): Promise<string> {
    return this.generateId('CGA');
  }

  async generateCommunityDirectoryId(): Promise<string> {
    return this.generateId('CDR');
  }

  async generateCommunityEventId(): Promise<string> {
    return this.generateId('CEV');
  }

  async generateCommunityNewsId(): Promise<string> {
    return this.generateId('CNE');
  }

  async generateCommunityDocumentId(): Promise<string> {
    return this.generateId('CDO');
  }

  async generateCommunityLocationId(): Promise<string> {
    return this.generateId('CLO');
  }

  async generateClanHistoryId(): Promise<string> {
    return this.generateId('CLH');
  }

  async generateClanGalleryId(): Promise<string> {
    return this.generateId('CGY');
  }

  async generateClanDirectoryId(): Promise<string> {
    return this.generateId('CDI');
  }

  async generateClanEventId(): Promise<string> {
    return this.generateId('CLE');
  }

  async generateClanDocumentId(): Promise<string> {
    return this.generateId('CLD');
  }

  async generateBookmarkId(): Promise<string> {
    return this.generateId('BMK');
  }

  async generateKnowledgeBaseId(): Promise<string> {
    return this.generateId('KB');
  }

  async generateDocumentVaultId(): Promise<string> {
    return this.generateId('DOC');
  }

  async generateDocumentFolderId(): Promise<string> {
    return this.generateId('DFL');
  }

  async generateDocumentShareId(): Promise<string> {
    return this.generateId('DSH');
  }

  async generateDocumentCollectionId(): Promise<string> {
    return this.generateId('DCO');
  }

  async generateDocumentGalleryId(): Promise<string> {
    return this.generateId('DGA');
  }

  async generateDocumentReferenceId(): Promise<string> {
    return this.generateId('DRE');
  }

  async generateDocumentPublicPageId(): Promise<string> {
    return this.generateId('DPP');
  }

  async generateDocumentKnowledgeBaseId(): Promise<string> {
    return this.generateId('DKB');
  }

  async generateTreeViewId(): Promise<string> {
    return this.generateId('TVW');
  }

  async generateTreeLayoutCacheId(): Promise<string> {
    return this.generateId('TLC');
  }

  async generateTreeBranchId(): Promise<string> {
    return this.generateId('TBR');
  }

  async generateTreeBookmarkId(): Promise<string> {
    return this.generateId('TBK');
  }

  async generateTreeSearchHistoryId(): Promise<string> {
    return this.generateId('TSH');
  }

  async generateTreeViewHistoryId(): Promise<string> {
    return this.generateId('TVH');
  }

  private idSeq = 0;

  async generateId(prefix: string): Promise<string> {
    const num = Date.now().toString(36).slice(-8).toUpperCase();
    const seq = (this.idSeq++ % 46656).toString(36).toUpperCase().padStart(3, '0');
    return `${prefix}-${num}${seq}`;
  }

  async generateEventCommentId(): Promise<string> {
    return this.generateId('EVCM');
  }

  async generateEventDocumentId(): Promise<string> {
    return this.generateId('EVDC');
  }

  async generateEventActivityId(): Promise<string> {
    return this.generateId('EVA');
  }

  async generateEventHistoryId(): Promise<string> {
    return this.generateId('EVH');
  }
}
