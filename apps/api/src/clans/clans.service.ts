import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { NotificationsEventService } from '../notifications/notifications-event.service';
import { ActivityEventService } from '../activities/activity-event.service';
import { CreateClanDto } from './dto/create-clan.dto';
import { UpdateClanDto } from './dto/update-clan.dto';

@Injectable()
export class ClansService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private notificationsEvent: NotificationsEventService,
    private activityEvent: ActivityEventService,
  ) {}

  async create(userId: string, dto: CreateClanDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const displayId = await this.identityService.generateClanId();
    const slug = await this.generateSlug(dto.name);

    const clan = await this.prisma.clan.create({
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
        website: dto.website,
        founder: dto.founder,
        privacy: dto.privacy || 'PUBLIC',
        communityId: dto.communityId || null,
        motto: dto.motto || null,
        symbol: dto.symbol || null,
        ownerId: userId,
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { families: true } },
      },
    });

    this.notificationsEvent.emit({
      type: 'CLAN_CREATED',
      title: 'Clan Created',
      message: `Your clan "${dto.name}" has been created successfully.`,
      userId,
      actionUrl: `/dashboard/clans/${clan.slug}`,
      metadata: { clanId: clan.id, clanName: dto.name, clanSlug: slug },
    }).catch(() => {});

    this.activityEvent.emit({
      userId,
      eventType: 'CLAN_CREATED',
      title: 'Created a clan',
      description: `Created clan "${dto.name}".`,
      visibility: 'PUBLIC',
      entityType: 'CLAN',
      entityId: clan.id,
      entityName: dto.name,
    }).catch(() => {});

    return clan;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string,
    country?: string,
    verified?: string,
  ) {
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (country) {
      where.country = { contains: country, mode: 'insensitive' };
    }

    if (verified !== undefined && verified !== null) {
      where.verified = verified === 'true';
    }

    const [clans, total] = await Promise.all([
      this.prisma.clan.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
          community: { select: { id: true, name: true, slug: true, logo: true } },
          _count: { select: { families: true, subClans: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clan.count({ where }),
    ]);

    return {
      clans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySlug(slug: string, userId?: string) {
    const clan = await this.prisma.clan.findFirst({
      where: { slug, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, avatar: true, city: true, country: true } },
        community: { select: { id: true, name: true, slug: true, logo: true } },
        families: {
          include: {
            _count: { select: { members: true } },
            owner: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        subClans: {
          include: {
            _count: { select: { families: true } },
            owner: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        admins: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: { select: { families: true, subClans: true } },
      },
    });

    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    if (clan.privacy === 'PRIVATE') {
      if (!userId) {
        throw new ForbiddenException('This clan is private');
      }
      if (clan.ownerId !== userId) {
        const admin = await this.prisma.clanAdmin.findUnique({
          where: { clanId_userId: { clanId: clan.id, userId } },
        });
        if (!admin) {
          const isFamilyMember = await this.prisma.family.findFirst({
            where: { clanId: clan.id, ownerId: userId },
          });
          if (!isFamilyMember) {
            throw new ForbiddenException('You do not have access to this private clan');
          }
        }
      }
    }

    const totalMembersResult = await this.prisma.familyMember.count({
      where: { family: { clanId: clan.id } },
    });

    const countriesResult = await this.prisma.familyMember.findMany({
      where: { family: { clanId: clan.id }, country: { not: null } },
      select: { country: true },
      distinct: ['country'],
    });

    const citiesResult = await this.prisma.familyMember.findMany({
      where: { family: { clanId: clan.id }, city: { not: null } },
      select: { city: true },
      distinct: ['city'],
    });

    const pendingRequests = await this.prisma.clanRequest.count({
      where: { clanId: clan.id, status: 'PENDING' },
    });

    const recentFamilies = clan.families.slice(0, 10);

    return {
      ...clan,
      recentFamilies,
      stats: {
        totalFamilies: clan._count.families,
        totalSubClans: clan._count.subClans,
        totalMembers: totalMembersResult,
        countries: countriesResult.map(c => c.country).filter(Boolean),
        cities: citiesResult.map(c => c.city).filter(Boolean),
        pendingRequests,
      },
    };
  }

  async findById(id: string) {
    const clan = await this.prisma.clan.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { families: true } },
      },
    });

    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    return clan;
  }

  async update(id: string, userId: string, dto: UpdateClanDto) {
    const clan = await this.prisma.clan.findUnique({ where: { id } });

    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    if (clan.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own clans');
    }

    const updateData: any = { ...dto };

    if (dto.name && dto.name !== clan.name) {
      updateData.slug = await this.generateSlug(dto.name, id);
    }

    const result = await this.prisma.clan.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { families: true } },
      },
    });

    this.activityEvent.emit({
      userId,
      eventType: 'CLAN_UPDATED',
      title: 'Updated a clan',
      description: `Updated clan "${clan.name}".`,
      visibility: 'PUBLIC',
      entityType: 'CLAN',
      entityId: id,
      entityName: clan.name,
    }).catch(() => {});

    return result;
  }

  async remove(id: string, userId: string) {
    const clan = await this.prisma.clan.findUnique({
      where: { id },
      include: { _count: { select: { families: true } } },
    });

    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    if (clan.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own clans');
    }

    if (clan._count.families > 0) {
      throw new BadRequestException(
        'Cannot delete clan with families attached. Remove all families from the clan first.',
      );
    }

    await this.prisma.clan.update({ where: { id }, data: { deletedAt: new Date() } });

    this.notificationsEvent.emit({
      type: 'CLAN_DELETED',
      title: 'Clan Deleted',
      message: `Your clan "${clan.name}" has been deleted.`,
      userId,
      priority: 'HIGH',
      metadata: { clanId: id, clanName: clan.name },
    }).catch(() => {});

    this.activityEvent.emit({
      userId,
      eventType: 'CLAN_DELETED',
      title: 'Deleted a clan',
      description: `Deleted clan "${clan.name}".`,
      visibility: 'PRIVATE',
      entityType: 'CLAN',
      entityName: clan.name,
    }).catch(() => {});

    return { message: 'Clan deleted successfully' };
  }

  async joinFamily(clanId: string, familyId: string, userId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const family = await this.prisma.family.findUnique({ where: { id: familyId } });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.ownerId !== userId) {
      throw new ForbiddenException('You can only add your own families to a clan');
    }

    if (family.clanId === clanId) {
      throw new BadRequestException('Family is already a member of this clan');
    }

    const updatedFamily = await this.prisma.family.update({
      where: { id: familyId },
      data: { clanId },
      include: {
        clan: { select: { id: true, name: true, slug: true, verified: true } },
        _count: { select: { members: true } },
      },
    });

    this.activityEvent.emit({
      userId,
      eventType: 'CLAN_FAMILY_JOINED',
      title: 'Family joined a clan',
      description: `Family "${family.name}" joined clan "${clan.name}".`,
      visibility: 'FAMILY',
      entityType: 'CLAN',
      entityId: clanId,
      entityName: clan.name,
      familyId,
      metadata: { familyId, familyName: family.name, clanId, clanName: clan.name },
    }).catch(() => {});

    return updatedFamily;
  }

  async leaveFamily(clanId: string, familyId: string, userId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const family = await this.prisma.family.findUnique({ where: { id: familyId } });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.ownerId !== userId) {
      throw new ForbiddenException('You can only remove your own families from a clan');
    }

    if (family.clanId !== clanId) {
      throw new BadRequestException('Family is not a member of this clan');
    }

    const updatedFamily = await this.prisma.family.update({
      where: { id: familyId },
      data: { clanId: null },
      include: {
        _count: { select: { members: true } },
      },
    });

    this.activityEvent.emit({
      userId,
      eventType: 'CLAN_FAMILY_LEFT',
      title: 'Family left a clan',
      description: `Family "${family.name}" left clan "${clan.name}".`,
      visibility: 'FAMILY',
      entityType: 'CLAN',
      entityId: clanId,
      entityName: clan.name,
      familyId,
      metadata: { familyId, familyName: family.name, clanId, clanName: clan.name },
    }).catch(() => {});

    return updatedFamily;
  }

  async getDashboard(clanId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const families = await this.prisma.family.findMany({
      where: { clanId },
      include: {
        _count: { select: { members: true } },
        members: { select: { id: true, birthDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const familyIds = families.map(f => f.id);

    const totalMembers = await this.prisma.familyMember.count({
      where: { familyId: { in: familyIds } },
    });

    const events = await this.prisma.timelineEvent.findMany({
      where: { familyId: { in: familyIds } },
      orderBy: { date: 'desc' },
    });

    const documents = await this.prisma.memory.count({
      where: { familyId: { in: familyIds } },
    });

    const totalPhotos = await this.prisma.familyMember.findMany({
      where: { familyId: { in: familyIds }, avatar: { not: null } },
      select: { id: true },
    }).then(members => members.length);

    const totalEvents = events.length;

    const yearsActive = (() => {
      if (families.length === 0) return 0;
      const oldest = families.reduce((a, b) => a.createdAt < b.createdAt ? a : b);
      const now = new Date();
      const created = new Date(oldest.createdAt);
      return Math.floor((now.getTime() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    })();

    const mostActiveFamilies = [...families]
      .sort((a, b) => b._count.members - a._count.members)
      .slice(0, 5)
      .map(f => ({
        id: f.id,
        name: f.name,
        memberCount: f._count.members,
        createdAt: f.createdAt,
      }));

    const newestFamilies = families.slice(0, 5).map(f => ({
      id: f.id,
      name: f.name,
      memberCount: f._count.members,
      createdAt: f.createdAt,
    }));

    const oldestFamilies = [...families]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, 5)
      .map(f => ({
        id: f.id,
        name: f.name,
        memberCount: f._count.members,
        createdAt: f.createdAt,
      }));

    const subClans = await this.prisma.subClan.findMany({
      where: { clanId },
      include: {
        _count: { select: { families: true } },
        owner: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const admins = await this.prisma.clanAdmin.findMany({
      where: { clanId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    const pendingRequests = await this.prisma.clanRequest.count({
      where: { clanId, status: 'PENDING' },
    });

    const timeline = events.slice(0, 50).map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date,
      type: e.eventType,
      familyId: e.familyId,
    }));

    return {
      totalFamilies: families.length,
      totalMembers,
      totalEvents,
      totalPhotos,
      totalDocuments: documents,
      timeline,
      yearsActive,
      mostActiveFamilies,
      newestFamilies,
      oldestFamilies,
      subClans: subClans.map(sc => ({
        id: sc.id,
        name: sc.name,
        slug: sc.slug,
        familyCount: sc._count.families,
        owner: sc.owner,
      })),
      admins: admins.map(a => ({
        id: a.id,
        role: a.role,
        user: a.user,
      })),
      pendingRequests,
    };
  }

  async getStats(clanId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const families = await this.prisma.family.findMany({
      where: { clanId },
      select: { id: true, name: true, createdAt: true },
    });

    const familyIds = families.map(f => f.id);

    const totalFamilies = families.length;

    const allMembers = await this.prisma.familyMember.findMany({
      where: { familyId: { in: familyIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
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
    const surnameCounts: Record<string, number> = {};

    let totalBirthYears = 0;
    let birthDateCount = 0;

    for (const member of allMembers) {
      if (member.country) countrySet.add(member.country);
      if (member.city) citySet.add(member.city);

      if (member.lastName) {
        const surname = member.lastName.toLowerCase().trim();
        surnameCounts[surname] = (surnameCounts[surname] || 0) + 1;
      }

      if (member.birthDate) {
        totalBirthYears += member.birthDate.getFullYear();
        birthDateCount++;
      }
    }

    const averageAge = birthDateCount > 0
      ? Math.round((new Date().getFullYear() - totalBirthYears / birthDateCount) * 10) / 10
      : null;

    const sortedSurnames = Object.entries(surnameCounts).sort((a, b) => b[1] - a[1]);
    const mostCommonSurname = sortedSurnames.length > 0
      ? { surname: sortedSurnames[0][0], count: sortedSurnames[0][1] }
      : null;

    const newestFamily = families.length > 0
      ? families.reduce((a, b) => a.createdAt > b.createdAt ? a : b)
      : null;

    const oldestFamily = families.length > 0
      ? families.reduce((a, b) => a.createdAt < b.createdAt ? a : b)
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
      newestFamily,
      oldestFamily,
      mostCommonSurname,
      recentGrowth,
    };
  }

  async getTopClans(limit: number = 10) {
    const clans = await this.prisma.clan.findMany({
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { families: true } },
      },
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    const clansWithFamilyCount = await Promise.all(
      clans.map(async (clan) => {
        const memberCount = await this.prisma.familyMember.count({
          where: { family: { clanId: clan.id } },
        });
        return { ...clan, totalMembers: memberCount };
      }),
    );

    clansWithFamilyCount.sort((a, b) => b._count.families - a._count.families);

    return clansWithFamilyCount.slice(0, limit);
  }

  async getPopularClans(limit: number = 10) {
    const clans = await this.prisma.clan.findMany({
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { families: true } },
      },
      where: { status: 'ACTIVE' },
    });

    const clansWithMemberCount = await Promise.all(
      clans.map(async (clan) => {
        const memberCount = await this.prisma.familyMember.count({
          where: { family: { clanId: clan.id } },
        });
        return { ...clan, totalMembers: memberCount };
      }),
    );

    clansWithMemberCount.sort((a, b) => b.totalMembers - a.totalMembers);

    return clansWithMemberCount.slice(0, limit);
  }

  async getRecentClans(limit: number = 10) {
    return this.prisma.clan.findMany({
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { families: true } },
      },
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async searchInsideClan(clanId: string, query: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      return { families: [], members: [], subClans: [] };
    }

    const families = await this.prisma.family.findMany({
      where: {
        clanId,
        OR: [
          { name: { contains: trimmedQuery, mode: 'insensitive' } },
          { description: { contains: trimmedQuery, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: { select: { members: true } },
        owner: { select: { id: true, name: true, avatar: true } },
      },
      take: 20,
    });

    const members = await this.prisma.familyMember.findMany({
      where: {
        family: { clanId },
        OR: [
          { firstName: { contains: trimmedQuery, mode: 'insensitive' } },
          { lastName: { contains: trimmedQuery, mode: 'insensitive' } },
          { email: { contains: trimmedQuery, mode: 'insensitive' } },
          { city: { contains: trimmedQuery, mode: 'insensitive' } },
          { country: { contains: trimmedQuery, mode: 'insensitive' } },
          { occupation: { contains: trimmedQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        displayId: true,
        firstName: true,
        lastName: true,
        avatar: true,
        city: true,
        country: true,
        occupation: true,
        family: { select: { id: true, name: true } },
      },
      take: 20,
    });

    const subClans = await this.prisma.subClan.findMany({
      where: {
        clanId,
        OR: [
          { name: { contains: trimmedQuery, mode: 'insensitive' } },
          { description: { contains: trimmedQuery, mode: 'insensitive' } },
          { region: { contains: trimmedQuery, mode: 'insensitive' } },
          { country: { contains: trimmedQuery, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: { select: { families: true } },
        owner: { select: { id: true, name: true, avatar: true } },
      },
      take: 20,
    });

    return { families, members, subClans };
  }

  async getClansForUser(userId: string) {
    const ownedClans = await this.prisma.clan.findMany({
      where: { ownerId: userId },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { families: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const memberClans = await this.prisma.clan.findMany({
      where: {
        families: { some: { ownerId: userId } },
        ownerId: { not: userId },
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { families: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { ownedClans, memberClans };
  }

  async getAdmins(clanId: string) {
    const admins = await this.prisma.clanAdmin.findMany({
      where: { clanId },
      include: {
        user: { select: { id: true, name: true, avatar: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
      select: { owner: { select: { id: true, name: true, avatar: true, email: true } } },
    });

    return {
      owner: clan!.owner,
      admins: admins.map(a => ({
        id: a.id,
        displayId: a.displayId,
        role: a.role,
        user: a.user,
        createdAt: a.createdAt,
      })),
    };
  }

  async addAdmin(clanId: string, userId: string, dto: { userId: string; role: string }) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) throw new NotFoundException('Clan not found');
    if (clan.ownerId !== userId) throw new ForbiddenException('Only the owner can add admins');

    const existing = await this.prisma.clanAdmin.findUnique({
      where: { clanId_userId: { clanId, userId: dto.userId } },
    });
    if (existing) throw new BadRequestException('User is already an admin');

    const displayId = await this.identityService.generateClanAdminId();

    const admin = await this.prisma.clanAdmin.create({
      data: {
        displayId,
        clanId,
        userId: dto.userId,
        role: dto.role || 'ADMIN',
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    await this.activityEvent.emitAdminAction(
      userId,
      'Admin Added',
      `Added admin to clan`,
      { action: 'added_admin', adminUserId: dto.userId, clanId },
    );

    return admin;
  }

  async updateAdmin(clanId: string, userId: string, adminId: string, dto: { role: string }) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) throw new NotFoundException('Clan not found');
    if (clan.ownerId !== userId) throw new ForbiddenException('Only the owner can update admins');

    const admin = await this.prisma.clanAdmin.findUnique({ where: { id: adminId } });
    if (!admin || admin.clanId !== clanId) throw new NotFoundException('Admin not found');

    return this.prisma.clanAdmin.update({
      where: { id: adminId },
      data: { role: dto.role },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async removeAdmin(clanId: string, userId: string, adminId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) throw new NotFoundException('Clan not found');
    if (clan.ownerId !== userId) throw new ForbiddenException('Only the owner can remove admins');

    const admin = await this.prisma.clanAdmin.findUnique({ where: { id: adminId } });
    if (!admin || admin.clanId !== clanId) throw new NotFoundException('Admin not found');

    await this.prisma.clanAdmin.delete({ where: { id: adminId } });

    return { message: 'Admin removed successfully' };
  }

  async generateSlug(name: string, excludeId?: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = base || 'clan';
    let counter = 0;

    while (true) {
      const existing = await this.prisma.clan.findUnique({
        where: { slug },
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
