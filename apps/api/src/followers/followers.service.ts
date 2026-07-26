import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowersService {
  constructor(private prisma: PrismaService) {}

  async followCommunity(userId: string, communityId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const existing = await this.prisma.communityFollower.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });

    if (existing) {
      throw new BadRequestException('Already following this community');
    }

    const follower = await this.prisma.communityFollower.create({
      data: { communityId, userId },
      include: {
        community: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return follower;
  }

  async unfollowCommunity(userId: string, communityId: string) {
    const existing = await this.prisma.communityFollower.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });

    if (!existing) {
      throw new NotFoundException('Not following this community');
    }

    await this.prisma.communityFollower.delete({
      where: { communityId_userId: { communityId, userId } },
    });

    return { message: 'Unfollowed community successfully' };
  }

  async followClan(userId: string, clanId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const existing = await this.prisma.clanFollower.findUnique({
      where: { clanId_userId: { clanId, userId } },
    });

    if (existing) {
      throw new BadRequestException('Already following this clan');
    }

    const follower = await this.prisma.clanFollower.create({
      data: { clanId, userId },
      include: {
        clan: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return follower;
  }

  async unfollowClan(userId: string, clanId: string) {
    const existing = await this.prisma.clanFollower.findUnique({
      where: { clanId_userId: { clanId, userId } },
    });

    if (!existing) {
      throw new NotFoundException('Not following this clan');
    }

    await this.prisma.clanFollower.delete({
      where: { clanId_userId: { clanId, userId } },
    });

    return { message: 'Unfollowed clan successfully' };
  }

  async getCommunityFollowers(communityId: string, page: number = 1, limit: number = 20) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const [followers, total] = await Promise.all([
      this.prisma.communityFollower.findMany({
        where: { communityId },
        include: {
          user: { select: { id: true, name: true, avatar: true, country: true, city: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { followedAt: 'desc' },
      }),
      this.prisma.communityFollower.count({ where: { communityId } }),
    ]);

    return {
      followers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getClanFollowers(clanId: string, page: number = 1, limit: number = 20) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const [followers, total] = await Promise.all([
      this.prisma.clanFollower.findMany({
        where: { clanId },
        include: {
          user: { select: { id: true, name: true, avatar: true, country: true, city: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { followedAt: 'desc' },
      }),
      this.prisma.clanFollower.count({ where: { clanId } }),
    ]);

    return {
      followers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async isFollowingCommunity(userId: string, communityId: string) {
    const existing = await this.prisma.communityFollower.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });

    return { isFollowing: !!existing };
  }

  async isFollowingClan(userId: string, clanId: string) {
    const existing = await this.prisma.clanFollower.findUnique({
      where: { clanId_userId: { clanId, userId } },
    });

    return { isFollowing: !!existing };
  }

  async getCommunityFollowerCount(communityId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const count = await this.prisma.communityFollower.count({ where: { communityId } });

    return { communityId, followerCount: count };
  }

  async getClanFollowerCount(clanId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const count = await this.prisma.clanFollower.count({ where: { clanId } });

    return { clanId, followerCount: count };
  }

  async getMyFollows(userId: string, type?: 'community' | 'clan') {
    const result: any = {};

    if (!type || type === 'community') {
      const communityFollows = await this.prisma.communityFollower.findMany({
        where: { userId },
        include: {
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              description: true,
              verified: true,
              country: true,
            },
          },
        },
        orderBy: { followedAt: 'desc' },
      });
      result.communities = communityFollows.map((f) => ({
        ...f.community,
        followedAt: f.followedAt,
      }));
    }

    if (!type || type === 'clan') {
      const clanFollows = await this.prisma.clanFollower.findMany({
        where: { userId },
        include: {
          clan: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              description: true,
              verified: true,
              country: true,
            },
          },
        },
        orderBy: { followedAt: 'desc' },
      });
      result.clans = clanFollows.map((f) => ({
        ...f.clan,
        followedAt: f.followedAt,
      }));
    }

    return result;
  }
}
