import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../common/permissions.service';
import { CreateTimelineEventDto, UpdateTimelineEventDto, RsvpDto } from './dto/create-timeline-event.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TimelineService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private notificationsService: NotificationsService,
    private permissionsService: PermissionsService,
  ) {}

  async create(dto: CreateTimelineEventDto, userId?: string) {
    const family = await this.prisma.family.findUnique({ where: { id: dto.familyId } });
    if (!family) throw new NotFoundException('Family not found');

    const displayId = await this.identityService.generateTimelineEventId();
    const eventDate = dto.date ? new Date(dto.date) : null;

    const event = await this.prisma.timelineEvent.create({
      data: {
        displayId,
        slug: this.generateSlug(dto.title, displayId),
        familyId: dto.familyId,
        memberId: dto.memberId || null,
        eventType: dto.eventType,
        category: dto.category || 'Custom',
        title: dto.title,
        subtitle: dto.subtitle || null,
        description: dto.description,
        date: eventDate,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        time: dto.time || null,
        isAllDay: dto.isAllDay || false,
        timezone: dto.timezone || null,
        language: dto.language || null,
        country: dto.country || null,
        location: dto.location,
        venue: dto.venue || null,
        mapLink: dto.mapLink || null,
        coordinates: dto.coordinates as Prisma.InputJsonValue | undefined,
        coverImage: dto.coverImage || null,
        status: (dto.status || 'UPCOMING') as any,
        color: dto.color || this.getEventColor(dto.eventType),
        createdById: dto.createdById || userId || null,
        metadata: (dto.metadata as any) || undefined,
        isAuto: dto.isAuto || false,
        visibility: (dto.visibility || 'FAMILY') as any,
        subClanId: dto.subClanId || null,
        clanId: dto.clanId || null,
        communityId: dto.communityId || null,
        verified: dto.verified || false,
        pinned: dto.pinned || false,
        featured: dto.featured || false,
        recurrence: dto.recurrence || null,
        recurrenceRule: dto.recurrenceRule || null,
        seriesId: dto.seriesId || null,
        parentEventId: dto.parentEventId || null,
        maxAttendees: dto.maxAttendees || null,
        rsvpDeadline: dto.rsvpDeadline ? new Date(dto.rsvpDeadline) : null,
        tags: dto.tags || [],
        keywords: dto.keywords || [],
      },
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    if (dto.participantIds && dto.participantIds.length > 0) {
      await this.prisma.eventParticipant.createMany({
        data: dto.participantIds.map(pid => ({
          eventId: event.id,
          userId: pid,
          rsvpStatus: 'PENDING',
        })),
        skipDuplicates: true,
      });
    }

    if (dto.media && dto.media.length > 0) {
      await this.prisma.eventMedia.createMany({
        data: dto.media.map((m: any, i: number) => ({
          eventId: event.id,
          url: m.url,
          type: m.type || 'IMAGE',
          caption: m.caption || null,
          fileName: m.fileName || null,
          fileSize: m.fileSize || null,
          mimeType: m.mimeType || null,
          thumbnailUrl: m.thumbnailUrl || null,
          order: i,
        })),
      });
    }

    if (eventDate && eventDate.getTime() > Date.now()) {
      const reminderOffsets = [
        { days: 30, type: '30_DAYS_BEFORE' },
        { days: 14, type: '14_DAYS_BEFORE' },
        { days: 7, type: '7_DAYS_BEFORE' },
        { days: 3, type: '3_DAYS_BEFORE' },
        { days: 1, type: '1_DAY_BEFORE' },
        { days: 0, type: '2_HOURS_BEFORE' },
      ];

      const creatorId = dto.createdById || userId;
      if (creatorId) {
        const reminderData = reminderOffsets
          .filter(r => {
            if (r.days === 0) {
              const twoHoursBefore = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000);
              return twoHoursBefore.getTime() > Date.now();
            }
            const reminderDate = new Date(eventDate.getTime() - r.days * 24 * 60 * 60 * 1000);
            return reminderDate.getTime() > Date.now();
          })
          .map(r => {
            const scheduledAt = r.days === 0
              ? new Date(eventDate.getTime() - 2 * 60 * 60 * 1000)
              : new Date(eventDate.getTime() - r.days * 24 * 60 * 60 * 1000);
            return {
              eventId: event.id,
              userId: creatorId,
              reminderType: r.type,
              scheduledAt,
            };
          });

        if (reminderData.length > 0) {
          await this.prisma.eventReminder.createMany({ data: reminderData });
        }
      }
    }

    await this.generateSearchTags(event.id, { ...dto, event });
    await this.autoGenerateTags(event);
    await this.createActivity(event.id, 'EVENT_CREATED', `Event "${event.title}" was created`, userId);

    return event;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    familyId?: string;
    memberId?: string;
    eventType?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    status?: string;
    venue?: string;
    color?: string;
    createdById?: string;
    userId?: string;
    visibility?: string;
    cursor?: string;
  } = {}) {
    const { page = 1, limit = 50, familyId, memberId, eventType, dateFrom, dateTo, search, status, venue, color, createdById, userId, visibility, cursor } = options;

    const filters: Record<string, unknown> = {};
    filters.deletedAt = null;
    if (familyId) filters.familyId = familyId;
    if (memberId) filters.memberId = memberId;
    if (eventType) filters.eventType = eventType;
    if (status) filters.status = status;
    if (venue) filters.venue = { contains: venue, mode: 'insensitive' };
    if (color) filters.color = color;
    if (createdById) filters.createdById = createdById;
    if (dateFrom || dateTo) {
      filters.date = {};
      if (dateFrom) (filters.date as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (filters.date as Record<string, unknown>).lte = new Date(dateTo);
    }
    if (visibility) {
      filters.visibility = visibility;
    }

    const andConditions: any[] = [filters];

    if (userId) {
      const [visibleFamilyIds, visibleSubClanIds, visibleClanIds, visibleCommunityIds] = await Promise.all([
        this.permissionsService.getVisibleFamilyIds(userId),
        this.permissionsService.getVisibleSubClanIds(userId),
        this.permissionsService.getVisibleClanIds(userId),
        this.permissionsService.getVisibleCommunityIds(userId),
      ]);

      if (!familyId && !memberId && visibleFamilyIds.length === 0 && visibleSubClanIds.length === 0 && visibleClanIds.length === 0 && visibleCommunityIds.length === 0) {
        return { events: [], total: 0, page, limit, totalPages: 0, hasMore: false, nextCursor: null };
      }

      const visibilityConditions: any[] = [
        { visibility: 'PUBLIC' },
        { visibility: 'ONLY_ME', createdById: userId },
        { visibility: 'FAMILY', familyId: { in: visibleFamilyIds } },
        { visibility: 'SUB_CLAN', subClanId: { in: visibleSubClanIds } },
        { visibility: 'CLAN', clanId: { in: visibleClanIds } },
        { visibility: 'COMMUNITY', communityId: { in: visibleCommunityIds } },
      ];
      andConditions.push({ OR: visibilityConditions });
    }

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { venue: { contains: search, mode: 'insensitive' } },
          { displayId: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where = { AND: andConditions } as never;

    const baseInclude = {
      family: { select: { id: true, name: true } },
      member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      participants: {
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      },
      reminders: true,
      media: true,
    };

    let events: any[];
    let total: number;

    if (cursor) {
      // Cursor-based pagination: fetch limit+1 to detect if more pages exist
      const [cursorEvents, countResult] = await Promise.all([
        this.prisma.timelineEvent.findMany({
          where,
          include: baseInclude,
          cursor: { id: cursor },
          take: limit + 1,
          orderBy: { date: 'desc' },
        }),
        this.prisma.timelineEvent.count({ where }),
      ]);
      events = cursorEvents;
      total = countResult;
    } else {
      // Standard page-based pagination
      const [pageEvents, countResult] = await Promise.all([
        this.prisma.timelineEvent.findMany({
          where,
          include: baseInclude,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { date: 'desc' },
        }),
        this.prisma.timelineEvent.count({ where }),
      ]);
      events = pageEvents;
      total = countResult;
    }

    // If we got limit+1 results with cursor, there are more pages
    const hasMore = cursor ? events.length > limit : false;
    if (hasMore) events.pop(); // Remove the extra item used to detect next page

    const sortedEvents = this.smartSort(events);

    return {
      events: sortedEvents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore,
      nextCursor: hasMore ? sortedEvents[sortedEvents.length - 1]?.id ?? null : null,
    };
  }

  async findOne(id: string, userId?: string) {
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id },
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        reminders: true,
        media: { orderBy: { order: 'asc' } },
      },
    });
    if (!event) throw new NotFoundException('Timeline event not found');

    if (userId && event.visibility !== 'PUBLIC') {
      const canView = await this.permissionsService.canViewTimelineEvent(userId, event);
      if (!canView) throw new ForbiddenException('You do not have permission to view this event');
    }

    return event;
  }

  async findByFamily(familyId: string, options: {
    page?: number;
    limit?: number;
    eventType?: string;
    status?: string;
    venue?: string;
    color?: string;
    createdById?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    userId?: string;
  } = {}) {
    if (options.userId) {
      const visibleFamilyIds = await this.permissionsService.getVisibleFamilyIds(options.userId);
      if (!visibleFamilyIds.includes(familyId)) {
        return { events: [], total: 0, page: options.page || 1, limit: options.limit || 50, totalPages: 0, hasMore: false, nextCursor: null };
      }
    }
    return this.findAll({ ...options, familyId });
  }

  async findByMember(memberId: string, options: { page?: number; limit?: number; userId?: string } = {}) {
    if (options.userId) {
      const visibleFamilyIds = await this.permissionsService.getVisibleFamilyIds(options.userId);
      const member = await this.prisma.familyMember.findUnique({ where: { id: memberId }, select: { familyId: true } });
      if (!member || !visibleFamilyIds.includes(member.familyId)) {
        return { events: [], total: 0, page: options.page || 1, limit: options.limit || 50, totalPages: 0, hasMore: false, nextCursor: null };
      }
    }
    return this.findAll({ ...options, memberId });
  }

  async update(id: string, dto: UpdateTimelineEventDto, userId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const isCreator = event.createdById === userId;
    if (!isCreator) {
      const family = await this.prisma.family.findUnique({ where: { id: event.familyId } });
      if (!family || family.ownerId !== userId) throw new ForbiddenException('You can only edit your own events');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.familyId !== undefined) updateData.familyId = dto.familyId;
    if (dto.memberId !== undefined) updateData.memberId = dto.memberId || null;
    if (dto.eventType !== undefined) updateData.eventType = dto.eventType;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.subtitle !== undefined) updateData.subtitle = dto.subtitle || null;
    if (dto.description !== undefined) updateData.description = dto.description || null;
    if (dto.date !== undefined) updateData.date = dto.date ? new Date(dto.date) : null;
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.time !== undefined) updateData.time = dto.time || null;
    if (dto.isAllDay !== undefined) updateData.isAllDay = dto.isAllDay;
    if (dto.timezone !== undefined) updateData.timezone = dto.timezone || null;
    if (dto.language !== undefined) updateData.language = dto.language || null;
    if (dto.country !== undefined) updateData.country = dto.country || null;
    if (dto.location !== undefined) updateData.location = dto.location || null;
    if (dto.venue !== undefined) updateData.venue = dto.venue || null;
    if (dto.mapLink !== undefined) updateData.mapLink = dto.mapLink || null;
    if (dto.coordinates !== undefined) updateData.coordinates = dto.coordinates || undefined;
    if (dto.coverImage !== undefined) updateData.coverImage = dto.coverImage || null;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.color !== undefined) updateData.color = dto.color || null;
    if (dto.metadata !== undefined) updateData.metadata = (dto.metadata as any) || undefined;
    if (dto.isAuto !== undefined) updateData.isAuto = dto.isAuto;
    if (dto.verified !== undefined) updateData.verified = dto.verified;
    if (dto.pinned !== undefined) updateData.pinned = dto.pinned;
    if (dto.featured !== undefined) updateData.featured = dto.featured;
    if (dto.archived !== undefined) updateData.archived = dto.archived;
    if (dto.cancellationReason !== undefined) updateData.cancellationReason = dto.cancellationReason || null;
    if (dto.recurrence !== undefined) updateData.recurrence = dto.recurrence || null;
    if (dto.recurrenceRule !== undefined) updateData.recurrenceRule = dto.recurrenceRule || null;
    if (dto.maxAttendees !== undefined) updateData.maxAttendees = dto.maxAttendees || null;
    if (dto.rsvpDeadline !== undefined) updateData.rsvpDeadline = dto.rsvpDeadline ? new Date(dto.rsvpDeadline) : null;
    if (dto.tags !== undefined && dto.tags !== null) updateData.tags = dto.tags;
    if (dto.keywords !== undefined && dto.keywords !== null) updateData.keywords = dto.keywords;
    if (dto.notificationChannels !== undefined) updateData.notificationChannels = dto.notificationChannels;
    if (dto.hideFromPublic !== undefined) updateData.hideFromPublic = dto.hideFromPublic;
    if (dto.restrictScreenshots !== undefined) updateData.restrictScreenshots = dto.restrictScreenshots;

    await this.buildUpdateHistory(event, updateData, userId);

    if (dto.title !== undefined || dto.tags !== undefined || dto.keywords !== undefined) {
      await this.prisma.eventSearchTag.deleteMany({ where: { eventId: id } });
      await this.generateSearchTags(id, { ...dto, eventType: event.eventType });
    }

    const updatedEvent = await this.prisma.timelineEvent.update({
      where: { id },
      data: updateData,
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        reminders: true,
        media: true,
      },
    });

    if (dto.addParticipantIds && dto.addParticipantIds.length > 0) {
      await this.prisma.eventParticipant.createMany({
        data: dto.addParticipantIds.map(pid => ({
          eventId: id,
          userId: pid,
          rsvpStatus: 'PENDING',
        })),
        skipDuplicates: true,
      });
    }

    if (dto.removeParticipantIds && dto.removeParticipantIds.length > 0) {
      await this.prisma.eventParticipant.deleteMany({
        where: {
          eventId: id,
          userId: { in: dto.removeParticipantIds },
        },
      });
    }

    if (dto.media && dto.media.length > 0) {
      await this.prisma.eventMedia.deleteMany({ where: { eventId: id } });
      await this.prisma.eventMedia.createMany({
        data: dto.media.map((m: any, i: number) => ({
          eventId: id,
          url: m.url,
          type: m.type || 'IMAGE',
          caption: m.caption || null,
          fileName: m.fileName || null,
          fileSize: m.fileSize || null,
          mimeType: m.mimeType || null,
          thumbnailUrl: m.thumbnailUrl || null,
          order: i,
        })),
      });
    }

    await this.createActivity(id, 'EVENT_UPDATED', `Event "${updatedEvent.title}" was updated`, userId);
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string, isAdmin = false) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Timeline event not found');

    if (!isAdmin) {
      const isCreator = event.createdById === userId;
      if (!isCreator) {
        const family = await this.prisma.family.findUnique({ where: { id: event.familyId } });
        if (!family || family.ownerId !== userId) throw new ForbiddenException('You can only delete your own events');
      }
    }

    await this.prisma.timelineEvent.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });

    await this.createActivity(id, 'EVENT_DELETED', `Event "${event.title}" was deleted`, userId);
    await this.createHistory(id, userId, 'DELETE');
    return { message: 'Timeline event deleted' };
  }

  async getUpcomingEvents(userId: string) {
    const visibleFamilyIds = await this.permissionsService.getVisibleFamilyIds(userId);
    const visibleSubClanIds = await this.permissionsService.getVisibleSubClanIds(userId);
    const visibleClanIds = await this.permissionsService.getVisibleClanIds(userId);
    const visibleCommunityIds = await this.permissionsService.getVisibleCommunityIds(userId);

    if (visibleFamilyIds.length === 0 && visibleSubClanIds.length === 0 && visibleClanIds.length === 0 && visibleCommunityIds.length === 0) {
      return [];
    }

    const events = await this.prisma.timelineEvent.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'ARCHIVED'] },
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'ONLY_ME', createdById: userId },
          { visibility: 'FAMILY', familyId: { in: visibleFamilyIds } },
          { visibility: 'SUB_CLAN', subClanId: { in: visibleSubClanIds } },
          { visibility: 'CLAN', clanId: { in: visibleClanIds } },
          { visibility: 'COMMUNITY', communityId: { in: visibleCommunityIds } },
        ],
      },
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        participants: true,
        media: true,
      },
    });

    const eventsWithCountdown = events.map(event => ({
      ...event,
      countdown: this.getDaysLeft(event.date),
    }));

    return this.smartSort(eventsWithCountdown);
  }

  async getCalendarEvents(userId: string, year: number, month: number) {
    const families = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const familyIds = families.map(f => f.id);

    if (familyIds.length === 0) return {};

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const events = await this.prisma.timelineEvent.findMany({
      where: {
        familyId: { in: familyIds },
        date: { gte: startDate, lte: endDate },
      },
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { date: 'asc' },
    });

    const grouped: Record<string, any[]> = {};
    for (const event of events) {
      if (!event.date) continue;
      const dateKey = new Date(event.date).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    }

    return grouped;
  }

  async getCalendarWeek(userId: string, startDate: string) {
    const families = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const familyIds = families.map(f => f.id);

    if (familyIds.length === 0) return [];

    const start = new Date(startDate);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events = await this.prisma.timelineEvent.findMany({
      where: {
        familyId: { in: familyIds },
        date: { gte: start, lt: end },
      },
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { date: 'asc' },
    });

    return this.smartSort(events);
  }

  async getAgendaEvents(userId: string, dateFrom: string, dateTo: string) {
    const families = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const familyIds = families.map(f => f.id);

    if (familyIds.length === 0) return [];

    const events = await this.prisma.timelineEvent.findMany({
      where: {
        familyId: { in: familyIds },
        date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        participants: true,
        media: true,
      },
    });

    return this.smartSort(events);
  }

  async rsvp(eventId: string, userId: string, dto: RsvpDto) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const participant = await this.prisma.eventParticipant.upsert({
      where: {
        eventId_userId: { eventId, userId },
      },
      update: {
        rsvpStatus: dto.rsvpStatus as any,
        rsvpDate: new Date(),
      },
      create: {
        eventId,
        userId,
        rsvpStatus: dto.rsvpStatus as any,
        rsvpDate: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        event: { select: { id: true, title: true } },
      },
    });

    return participant;
  }

  async getEventParticipants(eventId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const participants = await this.prisma.eventParticipant.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const counts = {
      accepted: participants.filter(p => p.rsvpStatus === 'ACCEPTED').length,
      maybe: participants.filter(p => p.rsvpStatus === 'MAYBE').length,
      declined: participants.filter(p => p.rsvpStatus === 'DECLINED').length,
      pending: participants.filter(p => p.rsvpStatus === 'PENDING').length,
      total: participants.length,
    };

    return { participants, counts };
  }

  async getEventStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [total, byStatus, byEventType, upcomingCount, todayCount, monthCount] = await Promise.all([
      this.prisma.timelineEvent.count(),
      this.prisma.timelineEvent.groupBy({
        by: ['status'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.timelineEvent.groupBy({
        by: ['eventType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.timelineEvent.count({
        where: { date: { gte: now }, status: { notIn: ['CANCELLED', 'ARCHIVED'] } },
      }),
      this.prisma.timelineEvent.count({
        where: { date: { gte: startOfToday, lte: endOfToday } },
      }),
      this.prisma.timelineEvent.count({
        where: { date: { gte: startOfToday, lte: endOfMonth } },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
      byEventType: byEventType.map(t => ({ eventType: t.eventType, count: t._count.id })),
      upcomingCount,
      todayCount,
      monthCount,
    };
  }

  async getBirthdayEvents(userId: string) {
    const familyIds = await this.permissionsService.getVisibleFamilyIds(userId);

    if (familyIds.length === 0) return [];

    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId: { in: familyIds },
        birthDate: { not: null },
      },
      include: {
        family: { select: { id: true, name: true } },
      },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingBirthdays = members
      .map(member => {
        if (!member.birthDate) return null;
        const birthDate = new Date(member.birthDate);
        const thisYearBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());

        if (thisYearBirthday < startOfToday(now)) {
          thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
        }

        if (thisYearBirthday > thirtyDaysFromNow) return null;

        return {
          id: `birthday-${member.id}-${thisYearBirthday.getFullYear()}`,
          title: `${member.firstName}'s Birthday`,
          date: thisYearBirthday.toISOString(),
          eventType: 'BIRTH',
          status: thisYearBirthday.getTime() === startOfToday(now).getTime() ? 'TODAY' : 'UPCOMING',
          color: 'green',
          isSynthetic: true,
          member: {
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            avatar: member.avatar,
          },
          family: member.family,
          countdown: this.getDaysLeft(thisYearBirthday),
        };
      })
      .filter(Boolean);

    return this.smartSort(upcomingBirthdays);
  }

  async getAnniversaryEvents(userId: string) {
    const familyIds = await this.permissionsService.getVisibleFamilyIds(userId);

    if (familyIds.length === 0) return [];

    const marriages = await this.prisma.relationship.findMany({
      where: {
        fromMember: { familyId: { in: familyIds } },
        type: { in: ['HUSBAND', 'WIFE', 'SPOUSE'] },
      },
      include: {
        fromMember: { include: { family: { select: { id: true, name: true } } } },
        toMember: { select: { id: true, firstName: true, lastName: true, avatar: true, birthDate: true } },
      },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingAnniversaries = marriages
      .map(rel => {
        const marriageDate = rel.createdAt;
        const thisYearAnniversary = new Date(now.getFullYear(), marriageDate.getMonth(), marriageDate.getDate());

        if (thisYearAnniversary < startOfToday(now)) {
          thisYearAnniversary.setFullYear(thisYearAnniversary.getFullYear() + 1);
        }

        if (thisYearAnniversary > thirtyDaysFromNow) return null;

        const years = thisYearAnniversary.getFullYear() - marriageDate.getFullYear();

        return {
          id: `anniversary-${rel.id}-${thisYearAnniversary.getFullYear()}`,
          title: `${rel.fromMember.firstName} & ${rel.toMember.firstName}'s ${years}${ordinalSuffix(years)} Anniversary`,
          date: thisYearAnniversary.toISOString(),
          eventType: 'ANNIVERSARY',
          status: thisYearAnniversary.getTime() === startOfToday(now).getTime() ? 'TODAY' : 'UPCOMING',
          color: 'rose',
          isSynthetic: true,
          member: rel.fromMember,
          partner: rel.toMember,
          family: rel.fromMember.family,
          years,
          countdown: this.getDaysLeft(thisYearAnniversary),
        };
      })
      .filter(Boolean);

    return this.smartSort(upcomingAnniversaries);
  }

  async getUpcomingWidget(userId: string) {
    const families = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const familyIds = families.map(f => f.id);

    if (familyIds.length === 0) return [];

    const events = await this.prisma.timelineEvent.findMany({
      where: {
        familyId: { in: familyIds },
        status: { notIn: ['CANCELLED', 'ARCHIVED'] },
        date: { gte: new Date() },
      },
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      take: 50,
    });

    const eventsWithCountdown = events.map(event => ({
      ...event,
      countdown: this.getDaysLeft(event.date),
      daysLeft: this.getDaysLeft(event.date).daysLeft,
      isToday: this.getDaysLeft(event.date).daysLeft === 0,
      isTomorrow: this.getDaysLeft(event.date).daysLeft === 1,
    }));

    const sorted = this.smartSort(eventsWithCountdown);
    return sorted.slice(0, 5);
  }

  async getTodayEvents(userId: string) {
    const visibleFamilyIds = await this.permissionsService.getVisibleFamilyIds(userId);
    const visibleSubClanIds = await this.permissionsService.getVisibleSubClanIds(userId);
    const visibleClanIds = await this.permissionsService.getVisibleClanIds(userId);
    const visibleCommunityIds = await this.permissionsService.getVisibleCommunityIds(userId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const events = await this.prisma.timelineEvent.findMany({
      where: {
        date: { gte: startOfToday, lte: endOfToday },
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'ONLY_ME', createdById: userId },
          { visibility: 'FAMILY', familyId: { in: visibleFamilyIds } },
          { visibility: 'SUB_CLAN', subClanId: { in: visibleSubClanIds } },
          { visibility: 'CLAN', clanId: { in: visibleClanIds } },
          { visibility: 'COMMUNITY', communityId: { in: visibleCommunityIds } },
        ],
      },
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        media: true,
      },
      orderBy: { date: 'asc' },
    });

    return events;
  }

  async getRecentEvents(userId: string) {
    const visibleFamilyIds = await this.permissionsService.getVisibleFamilyIds(userId);
    const visibleSubClanIds = await this.permissionsService.getVisibleSubClanIds(userId);
    const visibleClanIds = await this.permissionsService.getVisibleClanIds(userId);
    const visibleCommunityIds = await this.permissionsService.getVisibleCommunityIds(userId);

    const events = await this.prisma.timelineEvent.findMany({
      where: {
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'ONLY_ME', createdById: userId },
          { visibility: 'FAMILY', familyId: { in: visibleFamilyIds } },
          { visibility: 'SUB_CLAN', subClanId: { in: visibleSubClanIds } },
          { visibility: 'CLAN', clanId: { in: visibleClanIds } },
          { visibility: 'COMMUNITY', communityId: { in: visibleCommunityIds } },
        ],
      },
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return events;
  }

  async getEventsByDateRange(userId: string, from: string, to: string) {
    const families = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const familyIds = families.map(f => f.id);

    if (familyIds.length === 0) return [];

    const events = await this.prisma.timelineEvent.findMany({
      where: {
        familyId: { in: familyIds },
        date: { gte: new Date(from), lte: new Date(to) },
      },
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        participants: true,
        media: true,
      },
    });

    return this.smartSort(events);
  }

  async createReminder(eventId: string, dto: any, userId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const reminderType = dto.reminderType || 'CUSTOM';
    const scheduledAt = dto.scheduledAt || dto.date || new Date().toISOString();
    const deliveryChannel = dto.deliveryChannel || dto.channel || null;

    const reminder = await this.prisma.eventReminder.create({
      data: {
        eventId,
        userId,
        reminderType,
        scheduledAt: new Date(scheduledAt),
        deliveryChannel,
      },
    });

    return reminder;
  }

  async getEventReminders(eventId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    return this.prisma.eventReminder.findMany({
      where: { eventId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async addTags(eventId: string, userId: string, tags: string[]) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const isCreator = event.createdById === userId;
    if (!isCreator) {
      const family = await this.prisma.family.findUnique({ where: { id: event.familyId } });
      if (!family || family.ownerId !== userId) throw new ForbiddenException('You can only edit your own events');
    }

    const updatedTags = [...new Set([...event.tags, ...tags])];
    return this.prisma.timelineEvent.update({
      where: { id: eventId },
      data: { tags: updatedTags },
    });
  }

  async removeTags(eventId: string, userId: string, tags: string[]) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const isCreator = event.createdById === userId;
    if (!isCreator) {
      const family = await this.prisma.family.findUnique({ where: { id: event.familyId } });
      if (!family || family.ownerId !== userId) throw new ForbiddenException('You can only edit your own events');
    }

    const updatedTags = event.tags.filter(t => !tags.includes(t));
    return this.prisma.timelineEvent.update({
      where: { id: eventId },
      data: { tags: updatedTags },
    });
  }

  async addKeywords(eventId: string, userId: string, keywords: string[]) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const isCreator = event.createdById === userId;
    if (!isCreator) {
      const family = await this.prisma.family.findUnique({ where: { id: event.familyId } });
      if (!family || family.ownerId !== userId) throw new ForbiddenException('You can only edit your own events');
    }

    const updatedKeywords = [...new Set([...event.keywords, ...keywords])];
    return this.prisma.timelineEvent.update({
      where: { id: eventId },
      data: { keywords: updatedKeywords },
    });
  }

  async removeKeywords(eventId: string, userId: string, keywords: string[]) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const isCreator = event.createdById === userId;
    if (!isCreator) {
      const family = await this.prisma.family.findUnique({ where: { id: event.familyId } });
      if (!family || family.ownerId !== userId) throw new ForbiddenException('You can only edit your own events');
    }

    const updatedKeywords = event.keywords.filter(k => !keywords.includes(k));
    return this.prisma.timelineEvent.update({
      where: { id: eventId },
      data: { keywords: updatedKeywords },
    });
  }

  async deleteReminder(eventId: string, reminderId: string, userId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const reminder = await this.prisma.eventReminder.findUnique({ where: { id: reminderId } });
    if (!reminder) throw new NotFoundException('Reminder not found');

    const isCreator = event.createdById === userId;
    if (!isCreator) {
      const family = await this.prisma.family.findUnique({ where: { id: event.familyId } });
      if (!family || family.ownerId !== userId) throw new ForbiddenException('You can only delete reminders for your own events');
    }

    await this.prisma.eventReminder.delete({ where: { id: reminderId } });
    return { message: 'Reminder deleted' };
  }

  async cancelEvent(id: string, userId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const family = await this.prisma.family.findUnique({ where: { id: event.familyId } });
    if (!family || family.ownerId !== userId) throw new ForbiddenException('You do not have access');

    return this.prisma.timelineEvent.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });
  }

  async completeEvent(id: string, userId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const family = await this.prisma.family.findUnique({ where: { id: event.familyId } });
    if (!family || family.ownerId !== userId) throw new ForbiddenException('You do not have access');

    return this.prisma.timelineEvent.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        family: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });
  }

  async getStats() {
    const [total, autoCount] = await Promise.all([
      this.prisma.timelineEvent.count(),
      this.prisma.timelineEvent.count({ where: { isAuto: true } }),
    ]);

    const byEventType = await this.prisma.timelineEvent.groupBy({
      by: ['eventType'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return { total, autoCount, byEventType: byEventType.map(t => ({ eventType: t.eventType, count: t._count.id })) };
  }

  private getDaysLeft(date: Date | null): { daysLeft: number; label: string; priority: number } {
    if (!date) return { daysLeft: 999, label: 'No date', priority: 999 };
    const now = new Date();
    const eventDate = new Date(date);
    const diffMs = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { daysLeft: diffDays, label: 'Past', priority: 60 };
    if (diffDays === 0) return { daysLeft: 0, label: 'Today', priority: 1 };
    if (diffDays === 1) return { daysLeft: 1, label: 'Tomorrow', priority: 2 };
    if (diffDays <= 7) return { daysLeft: diffDays, label: `${diffDays} Days Left`, priority: 3 };
    if (diffDays <= 30) return { daysLeft: diffDays, label: `${diffDays} Days Left`, priority: 4 };
    return { daysLeft: diffDays, label: `${diffDays} Days Left`, priority: 5 };
  }

  private smartSort(events: any[]): any[] {
    return events.sort((a, b) => {
      const aInfo = this.getDaysLeft(a.date);
      const bInfo = this.getDaysLeft(b.date);
      return aInfo.priority - bInfo.priority || (new Date(a.date || 0).getTime()) - (new Date(b.date || 0).getTime());
    });
  }

  private getEventColor(eventType: string): string {
    const colors: Record<string, string> = {
      BIRTH: 'green', MARRIAGE: 'pink', DEATH: 'gray', GRADUATION: 'blue',
      ANNIVERSARY: 'rose', MOVE: 'orange', EDUCATION: 'blue', CAREER: 'purple',
      AWARD: 'amber', MILITARY_SERVICE: 'green', IMMIGRATION: 'cyan',
      FAMILY_REUNION: 'emerald', FAMILY_CREATED: 'emerald', CUSTOM_EVENT: 'blue',
    };
    return colors[eventType] || 'slate';
  }

  private generateSlug(title: string, id: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `${base}-${id.slice(0, 8)}`;
  }

  private async generateSearchTags(eventId: string, data: any): Promise<void> {
    const tagSet = new Set<string>();

    if (data.title) tagSet.add(data.title.toLowerCase());
    if (data.description) {
      data.description.split(/\s+/).slice(0, 10).forEach((w: string) => tagSet.add(w.toLowerCase()));
    }
    if (data.location) tagSet.add(data.location.toLowerCase());
    if (data.venue) tagSet.add(data.venue.toLowerCase());
    if (data.eventType) tagSet.add(data.eventType.toLowerCase());
    if (data.tags && Array.isArray(data.tags)) {
      data.tags.forEach((t: string) => tagSet.add(t.toLowerCase()));
    }

    const tags = Array.from(tagSet).filter(t => t.length > 1);
    if (tags.length > 0) {
      await this.prisma.eventSearchTag.createMany({
        data: tags.map(tag => ({
          eventId,
          tag,
          category: tag === data.eventType?.toLowerCase() ? 'event_type' : 'general',
        })),
        skipDuplicates: true,
      });
    }
  }

  private async createActivity(eventId: string, action: string, description: string, userId?: string, metadata?: Record<string, unknown>): Promise<void> {
    const displayId = await this.identityService.generateId('EVA');
    await this.prisma.eventActivity.create({
      data: {
        displayId,
        eventId,
        userId: userId || null,
        action,
        description,
        metadata: (metadata as Prisma.InputJsonValue) || undefined,
      },
    });
  }

  private async createHistory(eventId: string, userId: string, action: string, field?: string, oldValue?: string, newValue?: string): Promise<void> {
    const displayId = await this.identityService.generateId('EVH');
    await this.prisma.eventHistory.create({
      data: {
        displayId,
        eventId,
        userId,
        action,
        field: field || null,
        oldValue: oldValue || null,
        newValue: newValue || null,
      },
    });
  }

  private buildUpdateHistory(oldEvent: any, updateData: Record<string, unknown>, userId: string): Promise<void[]> {
    const changes: Promise<void>[] = [];
    const trackFields = ['title', 'description', 'date', 'endDate', 'location', 'venue', 'status', 'visibility', 'eventType', 'category'];
    for (const field of trackFields) {
      if (updateData[field] !== undefined && String(oldEvent[field]) !== String(updateData[field])) {
        changes.push(this.createHistory(oldEvent.id, userId, 'UPDATE', field, String(oldEvent[field] || ''), String(updateData[field] || '')));
      }
    }
    return Promise.all(changes);
  }

  private async autoGenerateTags(event: any): Promise<void> {
    const autoTags: string[] = [];
    if (event.member?.firstName) autoTags.push(event.member.firstName.toLowerCase());
    if (event.member?.lastName) autoTags.push(event.member.lastName.toLowerCase());
    if (event.family?.name) autoTags.push(event.family.name.toLowerCase());
    if (event.location) autoTags.push(event.location.toLowerCase());
    if (event.date) autoTags.push(new Date(event.date).getFullYear().toString());
    if (autoTags.length > 0) {
      await this.prisma.eventSearchTag.createMany({
        data: autoTags.map(tag => ({ eventId: event.id, tag, category: 'auto' })),
        skipDuplicates: true,
      });
    }
  }

  // === SOFT DELETE / ARCHIVE / PIN / FEATURE ===

  async softDelete(id: string, userId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Timeline event not found');
    const family = await this.prisma.family.findUnique({ where: { id: event.familyId } });
    if (!family || family.ownerId !== userId) throw new ForbiddenException('You do not have access');

    const updated = await this.prisma.timelineEvent.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });

    await this.createActivity(id, 'EVENT_DELETED', `Event "${event.title}" was soft-deleted`, userId);
    await this.createHistory(id, userId, 'DELETE');
    return updated;
  }

  async archive(id: string, userId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Timeline event not found');
    const family = await this.prisma.family.findUnique({ where: { id: event.familyId } });
    if (!family || family.ownerId !== userId) throw new ForbiddenException('You do not have access');

    const updated = await this.prisma.timelineEvent.update({
      where: { id },
      data: { archived: true, status: 'ARCHIVED' },
    });

    await this.createActivity(id, 'EVENT_ARCHIVED', `Event "${event.title}" was archived`, userId);
    return updated;
  }

  async togglePin(id: string, userId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const updated = await this.prisma.timelineEvent.update({
      where: { id },
      data: { pinned: !event.pinned },
    });

    await this.createActivity(id, event.pinned ? 'EVENT_UNPINNED' : 'EVENT_PINNED', `Event "${event.title}" was ${event.pinned ? 'unpinned' : 'pinned'}`, userId);
    return updated;
  }

  async toggleFeature(id: string, userId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const updated = await this.prisma.timelineEvent.update({
      where: { id },
      data: { featured: !event.featured },
    });

    await this.createActivity(id, event.featured ? 'EVENT_UNFEATURED' : 'EVENT_FEATURED', `Event "${event.title}" was ${event.featured ? 'unfeatured' : 'featured'}`, userId);
    return updated;
  }

  async publish(id: string, userId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const updated = await this.prisma.timelineEvent.update({
      where: { id },
      data: { status: 'COMPLETED', publishedAt: new Date() },
    });

    await this.createActivity(id, 'EVENT_PUBLISHED', `Event "${event.title}" was published`, userId);
    await this.createHistory(id, userId, 'PUBLISH', 'status', event.status, 'COMPLETED');
    return updated;
  }

  async schedule(id: string, userId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Timeline event not found');

    const updated = await this.prisma.timelineEvent.update({
      where: { id },
      data: { status: 'SCHEDULED', scheduledAt: event.date || new Date() },
    });

    await this.createActivity(id, 'EVENT_SCHEDULED', `Event "${event.title}" was scheduled`, userId);
    return updated;
  }

  // === COMMENTS ===

  async addComment(eventId: string, userId: string, content: string, parentId?: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const displayId = await this.identityService.generateId('EVCM');
    const comment = await this.prisma.eventComment.create({
      data: {
        displayId,
        eventId,
        userId,
        content,
        parentId: parentId || null,
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    await this.createActivity(eventId, 'COMMENT_ADDED', `A comment was added to "${event.title}"`, userId);
    return comment;
  }

  async getComments(eventId: string, page = 1, limit = 50) {
    const [comments, total] = await Promise.all([
      this.prisma.eventComment.findMany({
        where: { eventId, parentId: null, deletedAt: null },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          replies: {
            where: { deletedAt: null },
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.eventComment.count({ where: { eventId, parentId: null, deletedAt: null } }),
    ]);

    return { comments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await this.prisma.eventComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('Not your comment');

    return this.prisma.eventComment.update({
      where: { id: commentId },
      data: { content, edited: true },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.eventComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('Not your comment');

    return this.prisma.eventComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
  }

  // === REACTIONS ===

  async addReaction(eventId: string, userId: string, emoji: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const existing = await this.prisma.eventReaction.findUnique({
      where: { eventId_userId_emoji: { eventId, userId, emoji } },
    });

    if (existing) {
      await this.prisma.eventReaction.delete({ where: { id: existing.id } });
      return { removed: true, emoji };
    }

    const reaction = await this.prisma.eventReaction.create({
      data: { eventId, userId, emoji },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    await this.createActivity(eventId, 'REACTION_ADDED', `A ${emoji} reaction was added to "${event.title}"`, userId);
    return reaction;
  }

  async getReactions(eventId: string) {
    const reactions = await this.prisma.eventReaction.findMany({
      where: { eventId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const grouped: Record<string, any[]> = {};
    for (const r of reactions) {
      if (!grouped[r.emoji]) grouped[r.emoji] = [];
      grouped[r.emoji].push(r);
    }

    return { reactions, grouped, total: reactions.length };
  }

  // === DOCUMENTS ===

  async addDocument(eventId: string, data: {
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize?: number;
    title?: string;
    description?: string;
    issueDate?: string;
    expiryDate?: string;
    ownerId?: string;
    privacy?: string;
    tags?: string[];
  }, userId: string) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const displayId = await this.identityService.generateId('EVDC');
    const doc = await this.prisma.eventDocument.create({
      data: {
        displayId,
        eventId,
        uploadedById: userId,
        ownerId: data.ownerId || null,
        fileName: data.fileName,
        fileType: data.fileType,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize || null,
        title: data.title || data.fileName,
        description: data.description || null,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        privacy: data.privacy || 'FAMILY',
        tags: data.tags || [],
      },
    });

    await this.createActivity(eventId, 'DOCUMENT_ADDED', `Document "${data.fileName}" was attached to "${event.title}"`, userId);
    return doc;
  }

  async getDocuments(eventId: string) {
    const docs = await this.prisma.eventDocument.findMany({
      where: { eventId },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
        owner: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { documents: docs, total: docs.length };
  }

  async updateDocument(docId: string, data: { title?: string; description?: string; verificationStatus?: string; privacy?: string }, userId: string) {
    const doc = await this.prisma.eventDocument.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.eventDocument.update({
      where: { id: docId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.verificationStatus !== undefined && { verificationStatus: data.verificationStatus }),
        ...(data.privacy !== undefined && { privacy: data.privacy }),
      },
    });
  }

  async removeDocument(docId: string, userId: string) {
    const doc = await this.prisma.eventDocument.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');

    await this.prisma.eventDocument.delete({ where: { id: docId } });
    await this.createActivity(doc.eventId, 'DOCUMENT_REMOVED', `Document "${doc.fileName}" was removed`, userId);
    return { message: 'Document removed' };
  }

  // === EVENT ACTIVITY ===

  async getActivity(eventId: string, page = 1, limit = 50) {
    const [activities, total] = await Promise.all([
      this.prisma.eventActivity.findMany({
        where: { eventId },
        include: { user: { select: { id: true, name: true, avatar: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.eventActivity.count({ where: { eventId } }),
    ]);

    return { activities, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // === EVENT HISTORY ===

  async getHistory(eventId: string, page = 1, limit = 50) {
    const [history, total] = await Promise.all([
      this.prisma.eventHistory.findMany({
        where: { eventId },
        include: { user: { select: { id: true, name: true, avatar: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.eventHistory.count({ where: { eventId } }),
    ]);

    return { history, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // === SEARCH ===

  async searchEvents(userId: string, query: string, page = 1, limit = 20) {
    const visibleFamilyIds = await this.permissionsService.getVisibleFamilyIds(userId);
    const visibleSubClanIds = await this.permissionsService.getVisibleSubClanIds(userId);
    const visibleClanIds = await this.permissionsService.getVisibleClanIds(userId);
    const visibleCommunityIds = await this.permissionsService.getVisibleCommunityIds(userId);

    const [events, total] = await Promise.all([
      this.prisma.timelineEvent.findMany({
        where: {
          OR: [
            { visibility: 'PUBLIC' },
            { visibility: 'ONLY_ME', createdById: userId },
            { visibility: 'FAMILY', familyId: { in: visibleFamilyIds } },
            { visibility: 'SUB_CLAN', subClanId: { in: visibleSubClanIds } },
            { visibility: 'CLAN', clanId: { in: visibleClanIds } },
            { visibility: 'COMMUNITY', communityId: { in: visibleCommunityIds } },
          ],
          AND: [
            { deletedAt: null },
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { location: { contains: query, mode: 'insensitive' } },
                { venue: { contains: query, mode: 'insensitive' } },
                { tags: { hasSome: [query.toLowerCase()] } },
                { keywords: { hasSome: [query.toLowerCase()] } },
                { searchTags: { some: { tag: { contains: query.toLowerCase() } } } },
              ],
            },
          ],
        },
        include: {
          family: { select: { id: true, name: true } },
          member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          searchTags: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.timelineEvent.count({
        where: {
          OR: [
            { visibility: 'PUBLIC' },
            { visibility: 'ONLY_ME', createdById: userId },
            { visibility: 'FAMILY', familyId: { in: visibleFamilyIds } },
          ],
          AND: [
            { deletedAt: null },
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { tags: { hasSome: [query.toLowerCase()] } },
                { searchTags: { some: { tag: { contains: query.toLowerCase() } } } },
              ],
            },
          ],
        },
      }),
    ]);

    return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // === DUPLICATE / DRAFT ===

  async duplicateEvent(eventId: string, userId: string) {
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: { media: true, participants: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    const displayId = await this.identityService.generateTimelineEventId();
    const newEvent = await this.prisma.timelineEvent.create({
      data: {
        displayId,
        slug: this.generateSlug(`${event.title} (Copy)`, displayId),
        familyId: event.familyId,
        memberId: event.memberId,
        eventType: event.eventType,
        category: event.category,
        title: `${event.title} (Copy)`,
        subtitle: event.subtitle,
        description: event.description,
        date: event.date,
        endDate: event.endDate,
        time: event.time,
        isAllDay: event.isAllDay,
        timezone: event.timezone,
        location: event.location,
        venue: event.venue,
        mapLink: event.mapLink,
        coverImage: event.coverImage,
        status: 'DRAFT',
        color: event.color,
        createdById: userId,
        visibility: event.visibility,
        subClanId: event.subClanId,
        clanId: event.clanId,
        communityId: event.communityId,
        tags: event.tags,
        keywords: event.keywords,
        metadata: event.metadata as any,
      },
    });

    if (event.media.length > 0) {
      await this.prisma.eventMedia.createMany({
        data: event.media.map(m => ({
          eventId: newEvent.id,
          url: m.url,
          type: m.type,
          caption: m.caption,
          order: m.order,
        })),
      });
    }

    await this.createActivity(newEvent.id, 'EVENT_DUPLICATED', `Event was duplicated from "${event.title}"`, userId);
    return newEvent;
  }

  async saveDraft(dto: CreateTimelineEventDto, userId: string) {
    const family = await this.prisma.family.findUnique({ where: { id: dto.familyId } });
    if (!family) throw new NotFoundException('Family not found');

    const displayId = await this.identityService.generateTimelineEventId();
    const event = await this.prisma.timelineEvent.create({
      data: {
        displayId,
        slug: this.generateSlug(dto.title, displayId),
        familyId: dto.familyId,
        memberId: dto.memberId || null,
        eventType: dto.eventType,
        category: dto.category || 'Custom',
        title: dto.title,
        subtitle: dto.subtitle || null,
        description: dto.description,
        date: dto.date ? new Date(dto.date) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        time: dto.time || null,
        isAllDay: dto.isAllDay || false,
        timezone: dto.timezone || null,
        language: dto.language || null,
        country: dto.country || null,
        location: dto.location,
        venue: dto.venue || null,
        mapLink: dto.mapLink || null,
        coordinates: dto.coordinates as Prisma.InputJsonValue | undefined,
        coverImage: dto.coverImage || null,
        status: 'DRAFT',
        color: dto.color || this.getEventColor(dto.eventType),
        createdById: userId,
        visibility: (dto.visibility || 'FAMILY') as any,
        subClanId: dto.subClanId || null,
        clanId: dto.clanId || null,
        communityId: dto.communityId || null,
        tags: dto.tags || [],
        keywords: dto.keywords || [],
        metadata: (dto.metadata as any) || undefined,
      },
    });

    await this.createActivity(event.id, 'DRAFT_SAVED', `Draft "${dto.title}" was saved`, userId);
    return event;
  }

  async getDrafts(userId: string, familyId?: string) {
    const where: any = {
      createdById: userId,
      status: 'DRAFT',
      deletedAt: null,
    };
    if (familyId) where.familyId = familyId;

    return this.prisma.timelineEvent.findMany({
      where,
      include: {
        family: { select: { id: true, name: true } },
        media: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async bulkDelete(ids: string[], userId: string) {
    const events = await this.prisma.timelineEvent.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
    const accessibleIds = (
      await Promise.all(
        events.map(async (e) => {
          const canAccess = await this.permissionsService.canViewTimelineEvent(userId, e);
          return canAccess ? e.id : null;
        }),
      )
    ).filter(Boolean) as string[];

    if (accessibleIds.length === 0) return { deleted: 0 };

    const result = await this.prisma.timelineEvent.updateMany({
      where: { id: { in: accessibleIds } },
      data: { deletedAt: new Date() },
    });
    return { deleted: result.count };
  }

  async bulkUpdateStatus(ids: string[], status: string, userId: string) {
    const events = await this.prisma.timelineEvent.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
    const accessibleIds = (
      await Promise.all(
        events.map(async (e) => {
          const canAccess = await this.permissionsService.canViewTimelineEvent(userId, e);
          return canAccess ? e.id : null;
        }),
      )
    ).filter(Boolean) as string[];

    if (accessibleIds.length === 0) return { updated: 0 };

    const result = await this.prisma.timelineEvent.updateMany({
      where: { id: { in: accessibleIds } },
      data: { status: status as any },
    });
    return { updated: result.count };
  }
}

function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
