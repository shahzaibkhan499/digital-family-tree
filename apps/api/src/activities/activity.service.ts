import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateActivityDto, CreateCommentDto, CreateReactionDto } from './dto/create-activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
  ) {}

  async create(dto: CreateActivityDto) {
    const displayId = await this.identityService.generateActivityId();

    return this.prisma.activity.create({
      data: {
        displayId,
        userId: dto.userId,
        familyId: dto.familyId || null,
        memberId: dto.memberId || null,
        eventType: dto.eventType,
        title: dto.title,
        description: dto.description,
        visibility: (dto.visibility || 'FAMILY') as any,
        entityType: dto.entityType,
        entityId: dto.entityId,
        entityName: dto.entityName,
        metadata: dto.metadata || undefined,
        createdBy: dto.createdBy,
      },
    });
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    eventType?: string;
    visibility?: string;
    userId?: string;
    familyId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      eventType,
      visibility,
      userId,
      familyId,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (visibility) where.visibility = visibility;
    if (userId) where.userId = userId;
    if (familyId) where.familyId = familyId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { entityName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true, displayId: true } },
          family: { select: { id: true, name: true, displayId: true } },
          _count: { select: { comments: true, reactions: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      activities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByFamily(familyId: string, options: {
    page?: number;
    limit?: number;
    eventType?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) {
    const { page = 1, limit = 20, eventType, dateFrom, dateTo } = options;

    const where: any = { familyId };
    if (eventType) where.eventType = eventType;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true, displayId: true } },
          family: { select: { id: true, name: true } },
          _count: { select: { comments: true, reactions: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      activities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUser(userId: string, options: {
    page?: number;
    limit?: number;
    eventType?: string;
  } = {}) {
    const { page = 1, limit = 20, eventType } = options;

    const where: any = { userId };
    if (eventType) where.eventType = eventType;

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true, displayId: true } },
          family: { select: { id: true, name: true } },
          _count: { select: { comments: true, reactions: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      activities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMine(userId: string, options: {
    page?: number;
    limit?: number;
    eventType?: string;
  } = {}) {
    const { page = 1, limit = 20, eventType } = options;

    const userFamilies = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const familyIds = userFamilies.map((f) => f.id);

    const where: any = {
      OR: [
        { userId },
        { familyId: { in: familyIds } },
      ],
    };
    if (eventType) where.eventType = eventType;

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true, displayId: true } },
          family: { select: { id: true, name: true } },
          _count: { select: { comments: true, reactions: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      activities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRecentForDashboard(userId: string, limit = 20) {
    const userFamilies = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const familyIds = userFamilies.map((f) => f.id);

    return this.prisma.activity.findMany({
      where: {
        OR: [
          { userId },
          { familyId: { in: familyIds } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        family: { select: { id: true, name: true } },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatar: true, displayId: true } },
        family: { select: { id: true, name: true } },
        media: { orderBy: { order: 'asc' } },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        reactions: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        _count: { select: { comments: true, reactions: true } },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  async getStats() {
    const [total, todayCount, weekCount, monthCount] = await Promise.all([
      this.prisma.activity.count(),
      this.prisma.activity.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      this.prisma.activity.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.activity.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    const byEventType = await this.prisma.activity.groupBy({
      by: ['eventType'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return {
      total,
      todayCount,
      weekCount,
      monthCount,
      byEventType: byEventType.map((t) => ({ eventType: t.eventType, count: t._count.id })),
    };
  }

  async remove(id: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');

    await this.prisma.activity.delete({ where: { id } });
    return { message: 'Activity deleted successfully' };
  }

  async addComment(activityId: string, userId: string, dto: CreateCommentDto) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');

    return this.prisma.activityComment.create({
      data: {
        activityId,
        userId,
        content: dto.content,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async removeComment(activityId: string, commentId: string, userId: string) {
    const comment = await this.prisma.activityComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.activityId !== activityId) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('You can only delete your own comments');

    await this.prisma.activityComment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted successfully' };
  }

  async toggleReaction(activityId: string, userId: string, dto: CreateReactionDto) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');

    const reactionType = dto.type || 'LIKE';

    const existing = await this.prisma.activityReaction.findUnique({
      where: {
        activityId_userId_type: {
          activityId,
          userId,
          type: reactionType,
        },
      },
    });

    if (existing) {
      await this.prisma.activityReaction.delete({ where: { id: existing.id } });
      return { removed: true, type: reactionType };
    }

    const reaction = await this.prisma.activityReaction.create({
      data: {
        activityId,
        userId,
        type: reactionType,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return { removed: false, reaction };
  }
}
