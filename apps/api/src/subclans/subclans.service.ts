import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { NotificationsEventService } from '../notifications/notifications-event.service';
import { ActivityEventService } from '../activities/activity-event.service';
import { CreateSubClanDto } from './dto/create-subclan.dto';
import { UpdateSubClanDto } from './dto/update-subclan.dto';

@Injectable()
export class SubClansService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private notificationsEvent: NotificationsEventService,
    private activityEvent: ActivityEventService,
  ) {}

  async create(userId: string, clanId: string, dto: CreateSubClanDto) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    if (clan.ownerId !== userId) {
      throw new ForbiddenException('Only the clan owner can create sub-clans');
    }

    const existing = await this.prisma.subClan.findFirst({
      where: { clanId, name: { equals: dto.name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException('A sub-clan with this name already exists in this clan');
    }

    if (dto.parentSubClanId) {
      const parent = await this.prisma.subClan.findUnique({
        where: { id: dto.parentSubClanId },
      });
      if (!parent) {
        throw new NotFoundException('Parent sub-clan not found');
      }
      if (parent.clanId !== clanId) {
        throw new BadRequestException('Parent sub-clan must belong to the same clan');
      }
    }

    const displayId = await this.identityService.generateSubClanId();
    const slug = await this.generateSlug(clanId, dto.name);

    const subClan = await this.prisma.subClan.create({
      data: {
        displayId,
        name: dto.name,
        slug,
        description: dto.description,
        history: dto.history,
        origin: dto.origin,
        region: dto.region,
        country: dto.country,
        logo: dto.logo,
        banner: dto.banner,
        founder: dto.founder,
        privacy: dto.privacy || 'PUBLIC',
        clanId,
        ownerId: userId,
        parentSubClanId: dto.parentSubClanId || null,
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        clan: { select: { id: true, name: true, slug: true } },
        _count: { select: { families: true } },
      },
    });

    this.notificationsEvent.emit({
      type: 'SUBCLAN_CREATED',
      title: 'Sub-Clan Created',
      message: `Your sub-clan "${dto.name}" has been created in clan "${clan.name}".`,
      userId,
      actionUrl: `/dashboard/clans/${clan.slug}/subclans/${subClan.slug}`,
      metadata: { subClanId: subClan.id, subClanName: dto.name, clanId, clanName: clan.name },
    }).catch(() => {});

    this.activityEvent.emit({
      userId,
      eventType: 'SUBCLAN_CREATED',
      title: 'Created a sub-clan',
      description: `Created sub-clan "${dto.name}" in clan "${clan.name}".`,
      visibility: 'PUBLIC',
      entityType: 'SUBCLAN',
      entityId: subClan.id,
      entityName: dto.name,
    }).catch(() => {});

    return subClan;
  }

  async findAll(clanId: string, page: number = 1, limit: number = 20, search?: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const where: any = { clanId, deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [subClans, total] = await Promise.all([
      this.prisma.subClan.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
          _count: { select: { families: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subClan.count({ where }),
    ]);

    return {
      subClans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySlug(slug: string, userId?: string) {
    const subClan = await this.prisma.subClan.findFirst({
      where: { slug, deletedAt: null, clan: { deletedAt: null } },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        clan: { select: { id: true, name: true, slug: true } },
        families: {
          include: {
            _count: { select: { members: true } },
            owner: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        childSubClans: {
          where: { deletedAt: null },
          include: {
            childSubClans: {
              where: { deletedAt: null },
            },
            _count: { select: { families: true } },
          },
        },
        parentSubClan: true,
        _count: { select: { families: true } },
      },
    });

    if (!subClan) {
      throw new NotFoundException('Sub-clan not found');
    }

    if (subClan.privacy === 'PRIVATE') {
      if (!userId) {
        throw new ForbiddenException('This sub-clan is private');
      }
      if (subClan.ownerId !== userId) {
        const parentClan = await this.prisma.clan.findUnique({
          where: { id: subClan.clanId },
        });
        if (!parentClan || (parentClan.ownerId !== userId)) {
          const isFamilyMember = await this.prisma.family.findFirst({
            where: { clanId: subClan.clanId, ownerId: userId },
          });
          if (!isFamilyMember) {
            throw new ForbiddenException('You do not have access to this private sub-clan');
          }
        }
      }
    }

    const totalMembersResult = await this.prisma.familyMember.count({
      where: { family: { subClanId: subClan.id } },
    });

    return {
      ...subClan,
      stats: {
        totalFamilies: subClan._count.families,
        totalMembers: totalMembersResult,
      },
    };
  }

  async findById(id: string) {
    const subClan = await this.prisma.subClan.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        clan: { select: { id: true, name: true, slug: true } },
        _count: { select: { families: true } },
      },
    });

    if (!subClan) {
      throw new NotFoundException('Sub-clan not found');
    }

    return subClan;
  }

  async update(id: string, userId: string, dto: UpdateSubClanDto) {
    const subClan = await this.prisma.subClan.findUnique({ where: { id } });

    if (!subClan) {
      throw new NotFoundException('Sub-clan not found');
    }

    if (subClan.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own sub-clans');
    }

    const updateData: any = { ...dto };

    if (dto.name && dto.name !== subClan.name) {
      updateData.slug = await this.generateSlug(subClan.clanId, dto.name, id);
    }

    const result = await this.prisma.subClan.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        clan: { select: { id: true, name: true, slug: true } },
        _count: { select: { families: true } },
      },
    });

    this.activityEvent.emit({
      userId,
      eventType: 'SUBCLAN_UPDATED',
      title: 'Updated a sub-clan',
      description: `Updated sub-clan "${subClan.name}".`,
      visibility: 'PUBLIC',
      entityType: 'SUBCLAN',
      entityId: id,
      entityName: subClan.name,
    }).catch(() => {});

    return result;
  }

  async remove(id: string, userId: string) {
    const subClan = await this.prisma.subClan.findUnique({
      where: { id },
      include: { _count: { select: { families: true } } },
    });

    if (!subClan) {
      throw new NotFoundException('Sub-clan not found');
    }

    if (subClan.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own sub-clans');
    }

    if (subClan._count.families > 0) {
      throw new BadRequestException(
        'Cannot delete sub-clan with families attached. Remove all families from the sub-clan first.',
      );
    }

    await this.prisma.subClan.update({ where: { id }, data: { deletedAt: new Date() } });

    this.notificationsEvent.emit({
      type: 'SUBCLAN_DELETED',
      title: 'Sub-Clan Deleted',
      message: `Your sub-clan "${subClan.name}" has been deleted.`,
      userId,
      priority: 'HIGH',
      metadata: { subClanId: id, subClanName: subClan.name },
    }).catch(() => {});

    this.activityEvent.emit({
      userId,
      eventType: 'SUBCLAN_DELETED',
      title: 'Deleted a sub-clan',
      description: `Deleted sub-clan "${subClan.name}".`,
      visibility: 'PRIVATE',
      entityType: 'SUBCLAN',
      entityName: subClan.name,
    }).catch(() => {});

    return { message: 'Sub-clan deleted successfully' };
  }

  async getStats(slug: string) {
    const subClan = await this.prisma.subClan.findFirst({ where: { slug } });
    if (!subClan) {
      throw new NotFoundException('Sub-clan not found');
    }

    const families = await this.prisma.family.findMany({
      where: { subClanId: subClan.id },
      select: { id: true, name: true, createdAt: true },
    });

    const familyIds = families.map(f => f.id);

    const totalFamilies = families.length;

    const allMembers = await this.prisma.familyMember.findMany({
      where: { familyId: { in: familyIds } },
      select: {
        id: true,
        gender: true,
        birthDate: true,
        country: true,
        city: true,
      },
    });

    const totalMembers = allMembers.length;

    const maleCount = allMembers.filter(m => m.gender?.toLowerCase() === 'male').length;
    const femaleCount = allMembers.filter(m => m.gender?.toLowerCase() === 'female').length;

    const countrySet = new Set<string>();
    const citySet = new Set<string>();

    let totalBirthYears = 0;
    let birthDateCount = 0;

    for (const member of allMembers) {
      if (member.country) countrySet.add(member.country);
      if (member.city) citySet.add(member.city);

      if (member.birthDate) {
        totalBirthYears += member.birthDate.getFullYear();
        birthDateCount++;
      }
    }

    const averageAge = birthDateCount > 0
      ? Math.round((new Date().getFullYear() - totalBirthYears / birthDateCount) * 10) / 10
      : null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentGrowth = families.filter(f => f.createdAt >= thirtyDaysAgo).length;

    return {
      totalFamilies,
      totalMembers,
      maleCount,
      femaleCount,
      countries: Array.from(countrySet),
      cities: Array.from(citySet),
      averageAge,
      recentGrowth,
    };
  }

  async getTree(subClanId: string): Promise<any> {
    const subClan = await this.prisma.subClan.findUnique({
      where: { id: subClanId },
      include: {
        childSubClans: {
          where: { deletedAt: null },
          include: {
            childSubClans: {
              where: { deletedAt: null },
              include: {
                childSubClans: {
                  where: { deletedAt: null },
                  include: {
                    childSubClans: {
                      where: { deletedAt: null },
                    },
                    _count: { select: { families: true } },
                  },
                },
                _count: { select: { families: true } },
              },
            },
            _count: { select: { families: true } },
          },
        },
        _count: { select: { families: true } },
      },
    });

    if (!subClan) {
      throw new NotFoundException('Sub-clan not found');
    }

    return subClan;
  }

  async getBreadcrumbs(subClanId: string): Promise<any[]> {
    const breadcrumbs: any[] = [];
    let currentId: string | null = subClanId;

    while (currentId) {
      const subClan: { id: string; name: string; slug: string; clanId: string; parentSubClanId: string | null } | null = await this.prisma.subClan.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, slug: true, clanId: true, parentSubClanId: true },
      });
      if (!subClan) break;
      breadcrumbs.unshift(subClan);
      currentId = subClan.parentSubClanId;
    }

    if (breadcrumbs.length > 0) {
      const clan = await this.prisma.clan.findUnique({
        where: { id: breadcrumbs[0].clanId },
        select: { id: true, name: true, slug: true },
      });
      if (clan) breadcrumbs.unshift({ ...clan, type: 'clan' });
    }

    return breadcrumbs;
  }

  async generateSlug(clanId: string, name: string, excludeId?: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = base || 'subclan';
    let counter = 0;

    while (true) {
      const existing = await this.prisma.subClan.findFirst({
        where: { clanId, slug },
        select: { id: true },
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        return slug;
      }

      counter++;
      slug = `${base}-${counter}`;
    }
  }
}
