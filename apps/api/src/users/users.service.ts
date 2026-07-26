import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsEventService } from '../notifications/notifications-event.service';
import { ActivityEventService } from '../activities/activity-event.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notificationsEvent: NotificationsEventService,
    private activityEvent: ActivityEventService,
  ) {}

  async findAll(page: number, limit: number, search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          _count: { select: { families: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const [
      totalUsers,
      totalFamilies,
      totalMembers,
      totalClans,
      totalCommunities,
      totalSubClans,
      pendingClanRequests,
      pendingCommunityRequests,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.family.count(),
      this.prisma.familyMember.count(),
      this.prisma.clan.count({ where: { deletedAt: null } }),
      this.prisma.community.count({ where: { deletedAt: null } }),
      this.prisma.subClan.count({ where: { deletedAt: null } }),
      this.prisma.clanRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.communityRequest.count({ where: { status: 'PENDING' } }),
    ]);

    let systemHealth = 'ok';
    let dbHealth = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbHealth = 'error';
      systemHealth = 'degraded';
    }

    return {
      totalUsers,
      totalFamilies,
      totalMembers,
      totalClans,
      totalCommunities,
      totalSubClans,
      pendingClanRequests,
      pendingCommunityRequests,
      systemHealth,
      dbHealth,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { families: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { currentPassword, newPassword, email, ...rest } = dto;

    if (email && email !== user.email) {
      await this.updateEmail(userId, email);
    }

    if (newPassword) {
      await this.changePassword(userId, currentPassword!, newPassword);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: rest,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const updatedFields = Object.keys(rest).filter((k) => (rest as any)[k] !== undefined);
    if (updatedFields.length > 0) {
      this.activityEvent.emitProfileUpdated(userId, updatedFields).catch(() => {});
    }

    return updatedUser;
  }

  async updateEmail(userId: string, newEmail: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existing && existing.id !== userId) {
      throw new ConflictException('Email already in use');
    }

    const result = await this.prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.notificationsEvent.emit({
      type: 'EMAIL_CHANGED',
      title: 'Email Changed',
      message: `Your email has been changed to ${newEmail}.`,
      userId,
      priority: 'HIGH',
    }).catch(() => {});

    this.activityEvent.emitSecurityEvent(userId, 'EMAIL_CHANGED', 'Email changed', `Email changed to ${newEmail}.`).catch(() => {});

    return result;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!currentPassword) {
      throw new BadRequestException('Current password is required');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.notificationsEvent.emit({
      type: 'PASSWORD_CHANGED',
      title: 'Password Changed',
      message: 'Your password has been changed successfully.',
      userId,
      priority: 'HIGH',
    }).catch(() => {});

    this.activityEvent.emitSecurityEvent(userId, 'PASSWORD_CHANGED', 'Password changed', 'Password was changed.').catch(() => {});

    return result;
  }

  async deleteAccount(userId: string, currentPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!currentPassword) {
      throw new BadRequestException('Current password is required');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Password is incorrect');
    }

    await this.prisma.user.delete({ where: { id: userId } });

    return { message: 'Account deleted successfully' };
  }

  async createLoginSession(userId: string, ip: string, userAgent: string, location?: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return this.prisma.loginSession.create({
      data: {
        userId,
        ipAddress: ip,
        userAgent,
        location: location || null,
        expiresAt,
      },
    });
  }

}
