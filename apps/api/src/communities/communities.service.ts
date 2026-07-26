import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { NotificationsEventService } from '../notifications/notifications-event.service';
import { ActivityEventService } from '../activities/activity-event.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@Injectable()
export class CommunitiesService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private notificationsEvent: NotificationsEventService,
    private activityEvent: ActivityEventService,
  ) {}

  async create(userId: string, dto: CreateCommunityDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.community.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException('A community with this name already exists');
    }

    const displayId = await this.identityService.generateCommunityId();
    const slug = await this.generateSlug(dto.name);

    const community = await this.prisma.community.create({
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
        foundedDate: dto.foundedDate ? new Date(dto.foundedDate) : null,
        languages: dto.languages,
        countries: dto.countries,
        contact: dto.contact,
        seoMetadata: dto.seoMetadata,
        ownerId: userId,
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { clans: true } },
      },
    });

    this.notificationsEvent.emit({
      type: 'COMMUNITY_CREATED',
      title: 'Community Created',
      message: `Your community "${dto.name}" has been created successfully.`,
      userId,
      actionUrl: `/dashboard/communities/${community.slug}`,
      metadata: { communityId: community.id, communityName: dto.name, communitySlug: slug },
    }).catch(() => {});

    this.activityEvent.emit({
      userId,
      eventType: 'COMMUNITY_CREATED',
      title: 'Created a community',
      description: `Created community "${dto.name}".`,
      visibility: 'PUBLIC',
      entityType: 'COMMUNITY',
      entityId: community.id,
      entityName: dto.name,
    }).catch(() => {});

    return community;
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

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
          _count: { select: { clans: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.community.count({ where }),
    ]);

    return {
      communities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySlug(slug: string, userId?: string) {
    const community = await this.prisma.community.findFirst({
      where: { slug, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        clans: {
          include: {
            _count: { select: { families: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { clans: true } },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (community.privacy === 'PRIVATE') {
      if (!userId) {
        throw new ForbiddenException('This community is private');
      }
      if (community.ownerId !== userId) {
        const admin = await this.prisma.communityAdmin.findUnique({
          where: { communityId_userId: { communityId: community.id, userId } },
        });
        if (!admin) {
          throw new ForbiddenException('You do not have access to this private community');
        }
      }
    }

    const totalFamiliesResult = await this.prisma.family.count({
      where: { clan: { communityId: community.id } },
    });

    const totalMembersResult = await this.prisma.familyMember.count({
      where: { family: { clan: { communityId: community.id } } },
    });

    return {
      ...community,
      stats: {
        totalClans: community._count.clans,
        totalFamilies: totalFamiliesResult,
        totalMembers: totalMembersResult,
      },
    };
  }

  async findById(id: string) {
    const community = await this.prisma.community.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { clans: true } },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    return community;
  }

  async update(id: string, userId: string, dto: UpdateCommunityDto) {
    const community = await this.prisma.community.findUnique({ where: { id } });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (community.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own communities');
    }

    const updateData: any = { ...dto };

    if (dto.name && dto.name !== community.name) {
      updateData.slug = await this.generateSlug(dto.name, id);
    }

    const result = await this.prisma.community.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { clans: true } },
      },
    });

    this.activityEvent.emit({
      userId,
      eventType: 'COMMUNITY_UPDATED',
      title: 'Updated a community',
      description: `Updated community "${community.name}".`,
      visibility: 'PUBLIC',
      entityType: 'COMMUNITY',
      entityId: id,
      entityName: community.name,
    }).catch(() => {});

    return result;
  }

  async remove(id: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id },
      include: { _count: { select: { clans: true } } },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (community.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own communities');
    }

    if (community._count.clans > 0) {
      throw new BadRequestException(
        'Cannot delete community with clans attached. Remove all clans from the community first.',
      );
    }

    await this.prisma.community.update({ where: { id }, data: { deletedAt: new Date() } });

    this.notificationsEvent.emit({
      type: 'COMMUNITY_DELETED',
      title: 'Community Deleted',
      message: `Your community "${community.name}" has been deleted.`,
      userId,
      priority: 'HIGH',
      metadata: { communityId: id, communityName: community.name },
    }).catch(() => {});

    this.activityEvent.emit({
      userId,
      eventType: 'COMMUNITY_DELETED',
      title: 'Deleted a community',
      description: `Deleted community "${community.name}".`,
      visibility: 'PRIVATE',
      entityType: 'COMMUNITY',
      entityName: community.name,
    }).catch(() => {});

    return { message: 'Community deleted successfully' };
  }

  async getStats(slug: string) {
    const community = await this.prisma.community.findUnique({ where: { slug } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const clans = await this.prisma.clan.findMany({
      where: { communityId: community.id },
      select: { id: true, name: true, verified: true, createdAt: true },
    });

    const clanIds = clans.map(c => c.id);

    const totalFamilies = await this.prisma.family.count({
      where: { clanId: { in: clanIds } },
    });

    const allMembers = await this.prisma.familyMember.findMany({
      where: { family: { clanId: { in: clanIds } } },
      select: {
        id: true,
        country: true,
        city: true,
        birthDate: true,
      },
    });

    const totalMembers = allMembers.length;

    const countrySet = new Set<string>();
    const citySet = new Set<string>();

    for (const member of allMembers) {
      if (member.country) countrySet.add(member.country);
      if (member.city) citySet.add(member.city);
    }

    const verifiedClans = clans.filter(c => c.verified).length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentGrowth = clans.filter(c => c.createdAt >= thirtyDaysAgo).length;

    return {
      totalClans: clans.length,
      totalFamilies,
      totalMembers,
      countries: Array.from(countrySet),
      cities: Array.from(citySet),
      verifiedClans,
      recentGrowth,
    };
  }

  async getTopCommunities(limit: number = 10) {
    const communities = await this.prisma.community.findMany({
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { clans: true } },
      },
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    const communitiesWithClanCount = await Promise.all(
      communities.map(async (community) => {
        const clanCount = await this.prisma.clan.count({
          where: { communityId: community.id },
        });
        return { ...community, totalClans: clanCount };
      }),
    );

    communitiesWithClanCount.sort((a, b) => b._count.clans - a._count.clans);

    return communitiesWithClanCount.slice(0, limit);
  }

  async getPopularCommunities(limit: number = 10) {
    const communities = await this.prisma.community.findMany({
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { clans: true } },
      },
      where: { status: 'ACTIVE' },
    });

    const communitiesWithMemberCount = await Promise.all(
      communities.map(async (community) => {
        const memberCount = await this.prisma.familyMember.count({
          where: { family: { clan: { communityId: community.id } } },
        });
        return { ...community, totalMembers: memberCount };
      }),
    );

    communitiesWithMemberCount.sort((a, b) => b.totalMembers - a.totalMembers);

    return communitiesWithMemberCount.slice(0, limit);
  }

  async getRecentCommunities(limit: number = 10) {
    return this.prisma.community.findMany({
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { clans: true } },
      },
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getCommunitiesForUser(userId: string) {
    const ownedCommunities = await this.prisma.community.findMany({
      where: { ownerId: userId },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { clans: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const memberCommunities = await this.prisma.community.findMany({
      where: {
        clans: { some: { families: { some: { ownerId: userId } } } },
        ownerId: { not: userId },
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { clans: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { ownedCommunities, memberCommunities };
  }

  // --- Community Admin Management ---

  async addAdmin(ownerId: string, communityId: string, targetUserId: string, role?: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (community.ownerId !== ownerId) {
      throw new ForbiddenException('Only the community owner can add admins');
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingAdmin = await this.prisma.communityAdmin.findUnique({
      where: { communityId_userId: { communityId, userId: targetUserId } },
    });
    if (existingAdmin) {
      throw new BadRequestException('User is already an admin of this community');
    }

    const displayId = await this.identityService.generateCommunityAdminId();

    const admin = await this.prisma.communityAdmin.create({
      data: {
        displayId,
        communityId,
        userId: targetUserId,
        role: role || 'ADMIN',
        grantedById: ownerId,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        grantedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    this.activityEvent.emit({
      userId: ownerId,
      eventType: 'COMMUNITY_ADMIN_ADDED',
      title: 'Added a community admin',
      description: `Added ${user.name} as admin to community "${community.name}".`,
      visibility: 'PRIVATE',
      entityType: 'COMMUNITY',
      entityId: communityId,
      entityName: community.name,
    }).catch(() => {});

    this.notificationsEvent.emit({
      type: 'COMMUNITY_ADMIN_ADDED',
      title: 'Community Admin Role',
      message: `You have been added as an admin to community "${community.name}".`,
      userId: targetUserId,
      actionUrl: `/dashboard/communities/${community.slug}`,
      metadata: { communityId, communityName: community.name, role: role || 'ADMIN' },
    }).catch(() => {});

    return admin;
  }

  async getAdmins(communityId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    return this.prisma.communityAdmin.findMany({
      where: { communityId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        grantedBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAdmin(ownerId: string, communityId: string, adminId: string, role: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (community.ownerId !== ownerId) {
      throw new ForbiddenException('Only the community owner can update admin roles');
    }

    const admin = await this.prisma.communityAdmin.findUnique({ where: { id: adminId } });
    if (!admin || admin.communityId !== communityId) {
      throw new NotFoundException('Admin not found for this community');
    }

    return this.prisma.communityAdmin.update({
      where: { id: adminId },
      data: { role },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        grantedBy: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async removeAdmin(ownerId: string, communityId: string, adminId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (community.ownerId !== ownerId) {
      throw new ForbiddenException('Only the community owner can remove admins');
    }

    const admin = await this.prisma.communityAdmin.findUnique({ where: { id: adminId } });
    if (!admin || admin.communityId !== communityId) {
      throw new NotFoundException('Admin not found for this community');
    }

    await this.prisma.communityAdmin.delete({ where: { id: adminId } });

    this.activityEvent.emit({
      userId: ownerId,
      eventType: 'COMMUNITY_ADMIN_REMOVED',
      title: 'Removed a community admin',
      description: `Removed an admin from community "${community.name}".`,
      visibility: 'PRIVATE',
      entityType: 'COMMUNITY',
      entityId: communityId,
      entityName: community.name,
    }).catch(() => {});

    return { message: 'Admin removed successfully' };
  }

  // --- Community Join Requests ---

  async createRequest(userId: string, communityId: string, familyId: string, message?: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const family = await this.prisma.family.findUnique({ where: { id: familyId } });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.ownerId !== userId) {
      throw new ForbiddenException('You can only request to join with your own families');
    }

    const existingMembership = await this.prisma.clan.findFirst({
      where: { communityId, families: { some: { id: familyId } } },
    });
    if (existingMembership) {
      throw new BadRequestException('Family is already a member of this community');
    }

    const existingPending = await this.prisma.communityRequest.findFirst({
      where: { communityId, familyId, status: 'PENDING' },
    });
    if (existingPending) {
      throw new BadRequestException('You already have a pending request for this community');
    }

    const displayId = await this.identityService.generateCommunityRequestId();

    const request = await this.prisma.communityRequest.create({
      data: {
        displayId,
        communityId,
        familyId,
        requestedById: userId,
        message,
        status: 'PENDING',
      },
      include: {
        community: { select: { id: true, name: true, slug: true } },
        family: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    this.notificationsEvent.emit({
      type: 'COMMUNITY_JOIN_REQUEST',
      title: 'Join Request',
      message: `${family.name} has requested to join community "${community.name}".`,
      userId: community.ownerId,
      actionUrl: `/dashboard/communities/${community.slug}/requests`,
      metadata: { requestId: request.id, communityId, familyId, familyName: family.name },
    }).catch(() => {});

    this.activityEvent.emit({
      userId,
      eventType: 'COMMUNITY_JOIN_REQUEST',
      title: 'Requested to join a community',
      description: `Requested to join community "${community.name}" with family "${family.name}".`,
      visibility: 'PRIVATE',
      entityType: 'COMMUNITY_REQUEST',
      entityId: request.id,
      entityName: community.name,
    }).catch(() => {});

    return request;
  }

  async getRequests(communityId: string, status?: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const where: any = { communityId };
    if (status) {
      where.status = status;
    }

    return this.prisma.communityRequest.findMany({
      where,
      include: {
        family: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true, avatar: true } },
        reviewedBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRequestStats(communityId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const [pending, approved, rejected] = await Promise.all([
      this.prisma.communityRequest.count({ where: { communityId, status: 'PENDING' } }),
      this.prisma.communityRequest.count({ where: { communityId, status: 'APPROVED' } }),
      this.prisma.communityRequest.count({ where: { communityId, status: 'REJECTED' } }),
    ]);

    return { pending, approved, rejected, total: pending + approved + rejected };
  }

  async approveRequest(userId: string, requestId: string) {
    const request = await this.prisma.communityRequest.findUnique({
      where: { id: requestId },
      include: { community: true, family: true },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been processed');
    }

    const community = request.community;
    if (community.ownerId !== userId) {
      const admin = await this.prisma.communityAdmin.findUnique({
        where: { communityId_userId: { communityId: community.id, userId } },
      });
      if (!admin) {
        throw new ForbiddenException('Only the community owner or admin can approve requests');
      }
    }

    const updatedRequest = await this.prisma.communityRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedById: userId,
        reviewedAt: new Date(),
      },
      include: {
        community: { select: { id: true, name: true, slug: true } },
        family: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    this.notificationsEvent.emit({
      type: 'COMMUNITY_JOIN_APPROVED',
      title: 'Join Request Approved',
      message: `Your request to join community "${community.name}" has been approved.`,
      userId: request.requestedById,
      actionUrl: `/dashboard/communities/${community.slug}`,
      metadata: { requestId, communityId: community.id, familyId: request.familyId },
    }).catch(() => {});

    this.activityEvent.emit({
      userId,
      eventType: 'COMMUNITY_JOIN_APPROVED',
      title: 'Approved a community join request',
      description: `Approved ${request.family.name} to join community "${community.name}".`,
      visibility: 'PRIVATE',
      entityType: 'COMMUNITY_REQUEST',
      entityId: requestId,
      entityName: community.name,
    }).catch(() => {});

    return updatedRequest;
  }

  async rejectRequest(userId: string, requestId: string, response?: string) {
    const request = await this.prisma.communityRequest.findUnique({
      where: { id: requestId },
      include: { community: true, family: true },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been processed');
    }

    const community = request.community;
    if (community.ownerId !== userId) {
      const admin = await this.prisma.communityAdmin.findUnique({
        where: { communityId_userId: { communityId: community.id, userId } },
      });
      if (!admin) {
        throw new ForbiddenException('Only the community owner or admin can reject requests');
      }
    }

    const updatedRequest = await this.prisma.communityRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        response,
        reviewedById: userId,
        reviewedAt: new Date(),
      },
      include: {
        community: { select: { id: true, name: true, slug: true } },
        family: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    this.notificationsEvent.emit({
      type: 'COMMUNITY_JOIN_REJECTED',
      title: 'Join Request Rejected',
      message: `Your request to join community "${community.name}" has been rejected.${response ? ` Reason: ${response}` : ''}`,
      userId: request.requestedById,
      priority: 'HIGH',
      metadata: { requestId, communityId: community.id, familyId: request.familyId },
    }).catch(() => {});

    this.activityEvent.emit({
      userId,
      eventType: 'COMMUNITY_JOIN_REJECTED',
      title: 'Rejected a community join request',
      description: `Rejected ${request.family.name}'s request to join community "${community.name}".`,
      visibility: 'PRIVATE',
      entityType: 'COMMUNITY_REQUEST',
      entityId: requestId,
      entityName: community.name,
    }).catch(() => {});

    return updatedRequest;
  }

  async cancelRequest(userId: string, requestId: string) {
    const request = await this.prisma.communityRequest.findUnique({
      where: { id: requestId },
      include: { community: true, family: true },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.requestedById !== userId) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('You can only cancel pending requests');
    }

    await this.prisma.communityRequest.delete({ where: { id: requestId } });

    this.activityEvent.emit({
      userId,
      eventType: 'COMMUNITY_JOIN_CANCELLED',
      title: 'Cancelled a community join request',
      description: `Cancelled request to join community "${request.community.name}".`,
      visibility: 'PRIVATE',
      entityType: 'COMMUNITY_REQUEST',
      entityName: request.community.name,
    }).catch(() => {});

    return { message: 'Request cancelled successfully' };
  }

  async generateSlug(name: string, excludeId?: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = base || 'community';
    let counter = 0;

    while (true) {
      const existing = await this.prisma.community.findUnique({
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
