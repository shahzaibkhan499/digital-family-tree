import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { ActivityEventService } from '../activities/activity-event.service';
import { AuthorizationService } from '../common/authorization.service';

@Injectable()
export class ClanHistoryService {
  private readonly validSections = [
    'origin',
    'migration',
    'culture',
    'traditions',
    'language',
    'religion',
    'personalities',
    'wars',
    'achievements',
    'villages',
    'maps',
    'general',
  ];

  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private activityEvent: ActivityEventService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getHistory(clanId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const entries = await this.prisma.clanHistoryEntry.findMany({
      where: { clanId },
      include: {
        editedBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { version: 'desc' },
    });

    const grouped: Record<string, any[]> = {};
    for (const entry of entries) {
      if (!grouped[entry.section]) {
        grouped[entry.section] = [];
      }
      grouped[entry.section].push(entry);
    }

    return { sections: grouped, total: entries.length };
  }

  async getSectionHistory(clanId: string, section: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    if (!this.validSections.includes(section)) {
      throw new NotFoundException(`Invalid section. Valid sections: ${this.validSections.join(', ')}`);
    }

    const entries = await this.prisma.clanHistoryEntry.findMany({
      where: { clanId, section },
      include: {
        editedBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { version: 'desc' },
    });

    return { section, entries, total: entries.length };
  }

  async createEntry(userId: string, clanId: string, section: string, content: string) {
    await this.authorizationService.requireClanOwnerOrAdmin(userId, clanId);

    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    if (!this.validSections.includes(section)) {
      throw new NotFoundException(`Invalid section. Valid sections: ${this.validSections.join(', ')}`);
    }

    const displayId = await this.identityService.generateClanHistoryEntryId();

    const latestEntry = await this.prisma.clanHistoryEntry.findFirst({
      where: { clanId, section },
      orderBy: { version: 'desc' },
    });

    const version = (latestEntry?.version || 0) + 1;

    const entry = await this.prisma.clanHistoryEntry.create({
      data: {
        displayId,
        clanId,
        section,
        content,
        version,
        editedById: userId,
        moderationStatus: 'PENDING',
      },
      include: {
        editedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    this.activityEvent.emit({
      userId,
      eventType: 'CLAN_HISTORY_CREATED',
      title: 'Added clan history',
      description: `Added ${section} history for clan "${clan.name}" (v${version}).`,
      visibility: 'PUBLIC',
      entityType: 'CLAN_HISTORY',
      entityId: entry.id,
      entityName: `${clan.name} - ${section}`,
    }).catch(() => {});

    return entry;
  }

  async updateEntry(userId: string, entryId: string, content: string) {
    const existingEntry = await this.prisma.clanHistoryEntry.findUnique({
      where: { id: entryId },
      include: { clan: true },
    });

    if (!existingEntry) {
      throw new NotFoundException('History entry not found');
    }

    await this.authorizationService.requireClanOwnerOrAdmin(userId, existingEntry.clanId);

    const latestEntry = await this.prisma.clanHistoryEntry.findFirst({
      where: { clanId: existingEntry.clanId, section: existingEntry.section },
      orderBy: { version: 'desc' },
    });

    const newVersion = (latestEntry?.version || 0) + 1;

    const newEntry = await this.prisma.clanHistoryEntry.create({
      data: {
        displayId: await this.identityService.generateClanHistoryEntryId(),
        clanId: existingEntry.clanId,
        section: existingEntry.section,
        content,
        version: newVersion,
        editedById: userId,
      },
      include: {
        editedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    this.activityEvent.emit({
      userId,
      eventType: 'CLAN_HISTORY_UPDATED',
      title: 'Updated clan history',
      description: `Updated ${existingEntry.section} history for clan "${existingEntry.clan.name}" (v${newVersion}).`,
      visibility: 'PUBLIC',
      entityType: 'CLAN_HISTORY',
      entityId: newEntry.id,
      entityName: `${existingEntry.clan.name} - ${existingEntry.section}`,
    }).catch(() => {});

    return newEntry;
  }

  async getEntryVersions(clanId: string, section: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    if (!this.validSections.includes(section)) {
      throw new NotFoundException(`Invalid section. Valid sections: ${this.validSections.join(', ')}`);
    }

    const entries = await this.prisma.clanHistoryEntry.findMany({
      where: { clanId, section },
      include: {
        editedBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { version: 'desc' },
    });

    return { section, versions: entries.map(e => ({ ...e, version: e.version })), total: entries.length };
  }

  async approveEntry(moderatorId: string, entryId: string, note?: string) {
    const entry = await this.prisma.clanHistoryEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Entry not found');

    return this.prisma.clanHistoryEntry.update({
      where: { id: entryId },
      data: {
        moderationStatus: 'APPROVED',
        moderatorId,
        moderatedAt: new Date(),
        moderatorNote: note || null,
      },
    });
  }

  async rejectEntry(moderatorId: string, entryId: string, note?: string) {
    const entry = await this.prisma.clanHistoryEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Entry not found');

    return this.prisma.clanHistoryEntry.update({
      where: { id: entryId },
      data: {
        moderationStatus: 'REJECTED',
        moderatorId,
        moderatedAt: new Date(),
        moderatorNote: note || null,
      },
    });
  }

  async requestChanges(moderatorId: string, entryId: string, note: string) {
    const entry = await this.prisma.clanHistoryEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Entry not found');

    return this.prisma.clanHistoryEntry.update({
      where: { id: entryId },
      data: {
        moderationStatus: 'CHANGES_REQUESTED',
        moderatorId,
        moderatedAt: new Date(),
        moderatorNote: note,
      },
    });
  }

  async getPendingEntries(clanId: string) {
    return this.prisma.clanHistoryEntry.findMany({
      where: { clanId, moderationStatus: 'PENDING' },
      include: { editedBy: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllEntriesWithModeration(clanId: string) {
    return this.prisma.clanHistoryEntry.findMany({
      where: { clanId },
      include: {
        editedBy: { select: { id: true, name: true, avatar: true } },
        moderator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
