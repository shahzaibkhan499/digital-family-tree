import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateNotificationDto, BroadcastNotificationDto, UpdatePreferencesDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
  ) {}

  async create(dto: CreateNotificationDto) {
    const displayId = await this.identityService.generateNotificationId();

    const notification = await this.prisma.notification.create({
      data: {
        displayId,
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        category: (dto.category || 'GENERAL') as any,
        priority: (dto.priority || 'NORMAL') as any,
        icon: dto.icon,
        actionUrl: dto.actionUrl,
        metadata: dto.metadata || undefined,
        createdBy: dto.createdBy,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });

    await this.prisma.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        userId: dto.userId,
        channel: 'IN_APP',
        status: 'DELIVERED',
        deliveredAt: new Date(),
      },
    });

    return notification;
  }

  async createBulk(dtos: CreateNotificationDto[]) {
    const results = [];
    for (const dto of dtos) {
      const result = await this.create(dto);
      results.push(result);
    }
    return results;
  }

  async findAll(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: string;
      category?: string;
      priority?: string;
      isRead?: boolean;
      isArchived?: boolean;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) {
    const { page = 1, limit = 20, type, category, priority, isRead, isArchived, search, dateFrom, dateTo } = options;

    const where: any = { userId };
    if (type) where.type = type;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (isRead !== undefined) where.isRead = isRead;
    if (isArchived !== undefined) where.isArchived = isArchived;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false, isArchived: false },
    });
    return { count };
  }

  async findOne(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only view your own notifications');
    }

    return notification;
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.findOne(id, userId);

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    await this.prisma.notificationAuditLog.create({
      data: {
        notificationId: id,
        performedById: userId,
        action: 'READ',
        details: { previousState: { isRead: notification.isRead } },
      },
    });

    return updated;
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { affected: result.count };
  }

  async archive(id: string, userId: string) {
    await this.findOne(id, userId);

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isArchived: true },
    });

    await this.prisma.notificationAuditLog.create({
      data: {
        notificationId: id,
        performedById: userId,
        action: 'ARCHIVED',
      },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.prisma.notification.delete({ where: { id } });

    return { message: 'Notification deleted successfully' };
  }

  async clearRead(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });

    return { deleted: result.count };
  }

  async getPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return prefs;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    await this.getPreferences(userId);

    return this.prisma.notificationPreference.update({
      where: { userId },
      data: dto,
    });
  }

  async getStats(userId: string) {
    const [total, unread, archived, todayCount, weekCount, monthCount] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false, isArchived: false } }),
      this.prisma.notification.count({ where: { userId, isArchived: true } }),
      this.prisma.notification.count({
        where: {
          userId,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const byType = await this.prisma.notification.groupBy({
      by: ['type'],
      where: { userId },
      _count: { id: true },
    });

    const byCategory = await this.prisma.notification.groupBy({
      by: ['category'],
      where: { userId },
      _count: { id: true },
    });

    return {
      total,
      unread,
      archived,
      todayCount,
      weekCount,
      monthCount,
      byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.id })),
    };
  }

  async broadcast(dto: BroadcastNotificationDto, adminId: string) {
    const where: any = { deletedAt: null };

    if (dto.target === 'premium') where.plan = 'premium';
    else if (dto.target === 'free') where.plan = 'free';
    else if (dto.target === 'admins') where.role = 'ADMIN';
    else if (dto.target === 'specific_user' && dto.targetId) where.id = dto.targetId;
    else if (dto.target === 'specific_family' && dto.targetId) {
      const familyMembers = await this.prisma.familyMember.findMany({
        where: { familyId: dto.targetId },
        select: { email: true },
      });
      const memberEmails = familyMembers.map((m) => m.email).filter(Boolean);
      where.email = { in: memberEmails };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    const notifications: any[] = [];
    for (const user of users) {
      const notification = await this.create({
        userId: user.id,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'ADMIN_ANNOUNCEMENT',
        category: dto.category || 'ADMIN',
        priority: dto.priority || 'HIGH',
        icon: dto.icon,
        actionUrl: dto.actionUrl,
        metadata: dto.metadata,
        createdBy: adminId,
      });
      notifications.push(notification);
    }

    return {
      broadcast: true,
      sent: notifications.length,
      target: dto.target || 'everyone',
    };
  }

  async findAllAdmin(options: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    category?: string;
    userId?: string;
  } = {}) {
    const { page = 1, limit = 20, search, type, category, userId } = options;

    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAnalytics() {
    const [total, unread, archived, todayCount] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { isRead: false, isArchived: false } }),
      this.prisma.notification.count({ where: { isArchived: true } }),
      this.prisma.notification.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    const byType = await this.prisma.notification.groupBy({
      by: ['type'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const byCategory = await this.prisma.notification.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    const recentActivity = await this.prisma.notificationAuditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        notification: { select: { id: true, title: true, type: true } },
        performer: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      total,
      unread,
      archived,
      todayCount,
      byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.id })),
      recentActivity,
    };
  }

  async removeAdmin(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted successfully' };
  }
}
