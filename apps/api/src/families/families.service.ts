import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { NotificationsEventService } from '../notifications/notifications-event.service';
import { ActivityEventService } from '../activities/activity-event.service';
import { TimelineService } from '../timeline/timeline.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';

@Injectable()
export class FamiliesService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private notificationsEvent: NotificationsEventService,
    private activityEvent: ActivityEventService,
    private timelineService: TimelineService,
  ) {}

  async findAllAdmin(page: number, limit: number, search?: string) {
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [families, total] = await Promise.all([
      this.prisma.family.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.family.count({ where }),
    ]);

    return {
      families,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(userId: string, dto: CreateFamilyDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const planLimit = this.getPlanLimit(user.plan);
    if (planLimit !== null) {
      const familyCount = await this.prisma.family.count({ where: { ownerId: userId, deletedAt: null } });
      if (familyCount >= planLimit) {
        throw new BadRequestException(
          `Family limit reached. Your ${user.plan} plan allows ${planLimit} families. Upgrade to create more.`,
        );
      }
    }

    const displayId = await this.identityService.generateFamilyId();

    const { clanId, subClanId, ...restDto } = dto;

    const family = await this.prisma.family.create({
      data: {
        displayId,
        ...restDto,
        ownerId: userId,
        ...(clanId ? { clanId } : {}),
        ...(subClanId ? { subClanId } : {}),
      },
      include: {
        _count: { select: { members: true } },
        clan: { select: { id: true, name: true, slug: true, verified: true } },
        subClan: { select: { id: true, name: true, slug: true } },
      },
    });

    this.notificationsEvent.emit({
      type: 'FAMILY_CREATED',
      title: 'Family Created',
      message: `Your family "${dto.name}" has been created successfully.`,
      userId,
      actionUrl: `/dashboard/families/${family.id}`,
      metadata: { familyId: family.id, familyName: dto.name },
    }).catch(() => {});

    this.activityEvent.emitFamilyCreated(userId, family.id, dto.name).catch(() => {});

    this.timelineService.create({
      familyId: family.id,
      eventType: 'FAMILY_CREATED',
      title: `Family "${dto.name}" was created`,
      description: dto.description || `A new family "${dto.name}" was established.`,
      date: new Date().toISOString(),
      isAuto: true,
    }).catch(() => {});

    return family;
  }

  async findAll(userId: string) {
    return this.prisma.family.findMany({
      where: { ownerId: userId, deletedAt: null },
      include: {
        _count: { select: { members: true } },
        clan: { select: { id: true, name: true, slug: true, verified: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // TODO: Family needs a privacy field to support PRIVATE/PUBLIC visibility levels like Community, Clan, SubClan
  async findOne(familyId: string, userId: string) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            fromRelationships: true,
            toRelationships: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        clan: { select: { id: true, name: true, slug: true, verified: true } },
        _count: { select: { members: true } },
      },
    });

    if (!family || family.deletedAt) {
      throw new NotFoundException('Family not found');
    }

    if (family.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this family');
    }

    return family;
  }

  async update(familyId: string, userId: string, dto: UpdateFamilyDto) {
    const family = await this.prisma.family.findUnique({ where: { id: familyId } });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own families');
    }

    const result = await this.prisma.family.update({
      where: { id: familyId },
      data: dto,
      include: {
        _count: { select: { members: true } },
      },
    });

    this.activityEvent.emitFamilyUpdated(userId, familyId, family.name).catch(() => {});

    return result;
  }

  async remove(familyId: string, userId: string) {
    const family = await this.prisma.family.findUnique({ where: { id: familyId } });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own families');
    }

    await this.prisma.family.update({ where: { id: familyId }, data: { deletedAt: new Date() } });

    this.notificationsEvent.emit({
      type: 'FAMILY_DELETED',
      title: 'Family Deleted',
      message: `Your family "${family.name}" has been deleted.`,
      userId,
      priority: 'HIGH',
      metadata: { familyId, familyName: family.name },
    }).catch(() => {});

    this.activityEvent.emitFamilyDeleted(userId, family.name).catch(() => {});

    return { message: 'Family deleted successfully' };
  }

  async getStats(userId: string) {
    const totalFamilies = await this.prisma.family.count({
      where: { ownerId: userId, deletedAt: null },
    });

    const families = await this.prisma.family.findMany({
      where: { ownerId: userId, deletedAt: null },
      select: { id: true, clanId: true },
    });

    const familyIds = families.map((f) => f.id);

    const totalMembers = await this.prisma.familyMember.count({
      where: { familyId: { in: familyIds } },
    });

    const totalRelationships = await this.prisma.relationship.count({
      where: {
        fromMember: { familyId: { in: familyIds } },
      },
    });

    const clanIds = [...new Set(families.map(f => f.clanId).filter(Boolean))] as string[];

    let clanStats = null;
    if (clanIds.length > 0) {
      const clans = await this.prisma.clan.findMany({
        where: { id: { in: clanIds } },
        select: { id: true, name: true, slug: true, verified: true, _count: { select: { families: true } } },
      });
      clanStats = clans;
    }

    const recentFamilies = await this.prisma.family.findMany({
      where: { ownerId: userId, deletedAt: null },
      include: {
        _count: { select: { members: true } },
        clan: { select: { id: true, name: true, slug: true, verified: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      totalFamilies,
      totalMembers,
      totalRelationships,
      clanStats,
      recentFamilies,
    };
  }

  async getFamilyLimitInfo(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const used = await this.prisma.family.count({ where: { ownerId: userId, deletedAt: null } });
    const limit = this.getPlanLimit(user.plan);

    return { used, limit };
  }

  private getPlanLimit(plan: string): number | null {
    switch (plan) {
      case 'free':
        return 3;
      case 'basic':
        return 10;
      case 'premium':
        return null;
      case 'enterprise':
        return null;
      default:
        return 3;
    }
  }

  async searchMemberByDisplayId(displayId: string) {
    const member = await this.prisma.familyMember.findUnique({
      where: { displayId },
      select: {
        id: true,
        displayId: true,
        firstName: true,
        lastName: true,
        avatar: true,
        city: true,
        family: { select: { id: true, name: true } },
      },
    });

    return member;
  }
}
