import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventVersionService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
  ) {}

  async saveVersion(
    eventId: string,
    data: Record<string, unknown>,
    createdById: string,
    changeSummary?: string,
    isRollback = false,
  ) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const maxVersion = await this.prisma.eventVersion.findFirst({
      where: { eventId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const nextVersionNumber = maxVersion ? maxVersion.versionNumber + 1 : 1;
    const displayId = await this.identityService.generateId('EVD');

    const version = await this.prisma.eventVersion.create({
      data: {
        displayId,
        eventId,
        userId: createdById,
        versionNumber: nextVersionNumber,
        changeType: isRollback ? 'ROLLBACK' : 'UPDATE',
        changeDescription: changeSummary || null,
        snapshot: data as Prisma.InputJsonValue,
        isRollback,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return version;
  }

  async getVersions(eventId: string, page = 1, limit = 20) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const [versions, total] = await Promise.all([
      this.prisma.eventVersion.findMany({
        where: { eventId },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { versionNumber: 'desc' },
      }),
      this.prisma.eventVersion.count({ where: { eventId } }),
    ]);

    return { versions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getVersion(versionId: string) {
    const version = await this.prisma.eventVersion.findUnique({
      where: { id: versionId },
      include: {
        event: { select: { id: true, title: true, displayId: true } },
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!version) throw new NotFoundException('Version not found');
    return version;
  }

  async compareVersions(versionId1: string, versionId2: string) {
    const [versionA, versionB] = await Promise.all([
      this.prisma.eventVersion.findUnique({ where: { id: versionId1 } }),
      this.prisma.eventVersion.findUnique({ where: { id: versionId2 } }),
    ]);

    if (!versionA) throw new NotFoundException(`Version ${versionId1} not found`);
    if (!versionB) throw new NotFoundException(`Version ${versionId2} not found`);

    const snapshotA = versionA.snapshot as Record<string, unknown>;
    const snapshotB = versionB.snapshot as Record<string, unknown>;

    const skipFields = new Set([
      'id', 'displayId', 'createdAt', 'updatedAt', 'slug',
      'participants', 'media', 'documents',
    ]);

    const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];
    const allKeys = new Set([...Object.keys(snapshotA), ...Object.keys(snapshotB)]);

    for (const key of allKeys) {
      if (skipFields.has(key)) continue;
      const valA = snapshotA[key];
      const valB = snapshotB[key];
      if (JSON.stringify(valA) !== JSON.stringify(valB)) {
        changes.push({ field: key, oldValue: valA, newValue: valB });
      }
    }

    return {
      versionA: { id: versionA.id, versionNumber: versionA.versionNumber, createdAt: versionA.createdAt },
      versionB: { id: versionB.id, versionNumber: versionB.versionNumber, createdAt: versionB.createdAt },
      changes,
    };
  }

  async rollbackToVersion(eventId: string, versionId: string, userId: string) {
    const version = await this.prisma.eventVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) throw new NotFoundException('Version not found');
    if (version.eventId !== eventId) {
      throw new BadRequestException('Version does not belong to this event');
    }

    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const snapshot = version.snapshot as Record<string, unknown>;

    const updateData: Record<string, unknown> = {};
    const fields = [
      'title', 'subtitle', 'description', 'eventType', 'category',
      'date', 'endDate', 'time', 'isAllDay', 'timezone', 'language', 'country',
      'location', 'venue', 'mapLink', 'coordinates', 'coverImage',
      'status', 'color', 'visibility', 'verified', 'pinned', 'featured',
      'recurrence', 'recurrenceRule', 'maxAttendees', 'tags', 'keywords', 'metadata',
    ];

    for (const field of fields) {
      if (snapshot[field] !== undefined) {
        updateData[field] = snapshot[field];
      }
    }

    updateData.rsvpDeadline = snapshot.rsvpDeadline ? new Date(snapshot.rsvpDeadline as string) : null;

    const updatedEvent = await this.prisma.timelineEvent.update({
      where: { id: eventId },
      data: updateData,
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        media: true,
      },
    });

    const newVersion = await this.saveVersion(
      eventId,
      snapshot,
      userId,
      `Rolled back to version ${version.versionNumber}`,
      true,
    );

    await this.prisma.eventVersion.update({
      where: { id: newVersion.id },
      data: { rolledBackFromId: versionId },
    });

    return { event: updatedEvent, version: newVersion };
  }

  async getLatestVersion(eventId: string) {
    const version = await this.prisma.eventVersion.findFirst({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { versionNumber: 'desc' },
    });

    return version || null;
  }
}
