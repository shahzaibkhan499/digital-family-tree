import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventActivityService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
  ) {}

  async createActivity(
    eventId: string,
    userId: string,
    action: string,
    details?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const displayId = await this.identityService.generateId('EVA');

    const metadata: Record<string, unknown> = {};
    if (ipAddress) metadata.ipAddress = ipAddress;
    if (userAgent) metadata.userAgent = userAgent;

    const activity = await this.prisma.eventActivity.create({
      data: {
        displayId,
        eventId,
        userId: userId || null,
        action,
        description: details || null,
        metadata: Object.keys(metadata).length > 0 ? (metadata as Prisma.InputJsonValue) : undefined,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return activity;
  }

  async getEventActivity(eventId: string, page = 1, limit = 20) {
    const [activities, total] = await Promise.all([
      this.prisma.eventActivity.findMany({
        where: { eventId },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.eventActivity.count({ where: { eventId } }),
    ]);

    return { activities, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUserActivityFeed(userId: string, page = 1, limit = 20) {
    const where = {
      OR: [
        { userId },
        { event: { createdById: userId } },
        { event: { participants: { some: { userId } } } },
      ],
    };

    const [activities, total] = await Promise.all([
      this.prisma.eventActivity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          event: { select: { id: true, title: true, eventType: true, date: true, familyId: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.eventActivity.count({ where }),
    ]);

    return { activities, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getFamilyActivityFeed(familyId: string, page = 1, limit = 20) {
    const where = { event: { familyId } };

    const [activities, total] = await Promise.all([
      this.prisma.eventActivity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          event: { select: { id: true, title: true, eventType: true, date: true, familyId: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.eventActivity.count({ where }),
    ]);

    return { activities, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getActivityStats(familyId?: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

    const baseWhere: Prisma.EventActivityWhereInput = familyId
      ? { event: { familyId } }
      : {};

    const todayWhere: Prisma.EventActivityWhereInput = familyId
      ? { event: { familyId }, createdAt: { gte: startOfToday } }
      : { createdAt: { gte: startOfToday } };

    const weekWhere: Prisma.EventActivityWhereInput = familyId
      ? { event: { familyId }, createdAt: { gte: startOfWeek } }
      : { createdAt: { gte: startOfWeek } };

    const [totalCount, byAction, todayCount, weekCount, recentActivity] = await Promise.all([
      this.prisma.eventActivity.count({ where: baseWhere }),
      this.prisma.eventActivity.groupBy({
        by: ['action'],
        where: baseWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.eventActivity.count({ where: todayWhere }),
      this.prisma.eventActivity.count({ where: weekWhere }),
      this.prisma.eventActivity.findMany({
        where: baseWhere,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          event: { select: { id: true, title: true, eventType: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalCount,
      byAction: byAction.map(a => ({ action: a.action, count: a._count.id })),
      todayCount,
      weekCount,
      recentActivity,
    };
  }
}
