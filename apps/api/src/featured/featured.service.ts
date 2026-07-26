import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeaturedService {
  constructor(private prisma: PrismaService) {}

  async getFeaturedCommunities(limit: number = 10) {
    const communities = await this.prisma.community.findMany({
      where: { verified: true, status: 'ACTIVE', deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        reputation: true,
        _count: { select: { clans: true, followers: true } },
      },
      orderBy: {
        reputation: { trustScore: 'desc' },
      },
      take: limit,
    });

    return communities;
  }

  async getFeaturedClans(limit: number = 10) {
    const clans = await this.prisma.clan.findMany({
      where: { verified: true, status: 'ACTIVE', deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        reputation: true,
        _count: { select: { families: true, followers: true } },
      },
      orderBy: {
        reputation: { heritageScore: 'desc' },
      },
      take: limit,
    });

    return clans;
  }

  async getTrendingCommunities(limit: number = 10) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const communities = await this.prisma.community.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        followers: { some: { followedAt: { gte: thirtyDaysAgo } } },
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: {
          select: {
            followers: true,
            events: true,
            newsItems: true,
            clans: true,
          },
        },
      },
      orderBy: {
        followers: { _count: 'desc' },
      },
      take: limit,
    });

    if (communities.length === 0) {
      const fallback = await this.prisma.community.findMany({
        where: { status: 'ACTIVE', deletedAt: null },
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
          _count: {
            select: {
              followers: true,
              events: true,
              newsItems: true,
              clans: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return fallback;
    }

    return communities;
  }

  async getTrendingClans(limit: number = 10) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const clans = await this.prisma.clan.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        followers: { some: { followedAt: { gte: thirtyDaysAgo } } },
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: {
          select: {
            followers: true,
            events: true,
            families: true,
            subClans: true,
          },
        },
      },
      orderBy: {
        followers: { _count: 'desc' },
      },
      take: limit,
    });

    if (clans.length === 0) {
      const fallback = await this.prisma.clan.findMany({
        where: { status: 'ACTIVE', deletedAt: null },
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
          _count: {
            select: {
              followers: true,
              events: true,
              families: true,
              subClans: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return fallback;
    }

    return clans;
  }

  async getRelatedCommunities(communityId: string, limit: number = 10) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const where: any = {
      id: { not: communityId },
      status: 'ACTIVE',
      deletedAt: null,
    };

    if (community.country) {
      where.OR = [
        { country: community.country },
        { region: community.region },
      ];
    } else if (community.region) {
      where.region = community.region;
    }

    const communities = await this.prisma.community.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { clans: true, followers: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return communities;
  }

  async getRelatedClans(clanId: string, limit: number = 10) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const where: any = {
      id: { not: clanId },
      status: 'ACTIVE',
      deletedAt: null,
    };

    if (clan.country) {
      where.OR = [
        { country: clan.country },
        { region: clan.region },
      ];
    } else if (clan.region) {
      where.region = clan.region;
    }

    const clans = await this.prisma.clan.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { families: true, followers: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return clans;
  }

  async getCommunityStats(communityId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const [memberCount, familyCount, followerCount, eventCount, documentCount, galleryCount, clanCount] =
      await Promise.all([
        this.prisma.familyMember.count({
          where: { family: { clan: { communityId } } },
        }),
        this.prisma.family.count({
          where: { clan: { communityId }, deletedAt: null },
        }),
        this.prisma.communityFollower.count({ where: { communityId } }),
        this.prisma.communityEvent.count({ where: { communityId } }),
        this.prisma.communityDocument.count({ where: { communityId } }),
        this.prisma.communityGallery.count({ where: { communityId } }),
        this.prisma.clan.count({ where: { communityId, deletedAt: null } }),
      ]);

    return {
      communityId,
      memberCount,
      familyCount,
      followerCount,
      eventCount,
      documentCount,
      galleryCount,
      clanCount,
    };
  }

  async getClanStats(clanId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const [memberCount, familyCount, followerCount, eventCount, documentCount, galleryCount, subClanCount] =
      await Promise.all([
        this.prisma.familyMember.count({
          where: { family: { clanId } },
        }),
        this.prisma.family.count({
          where: { clanId, deletedAt: null },
        }),
        this.prisma.clanFollower.count({ where: { clanId } }),
        this.prisma.clanEvent.count({ where: { clanId } }),
        this.prisma.clanDocument.count({ where: { clanId } }),
        this.prisma.clanGallery.count({ where: { clanId } }),
        this.prisma.subClan.count({ where: { clanId, deletedAt: null } }),
      ]);

    return {
      clanId,
      memberCount,
      familyCount,
      followerCount,
      eventCount,
      documentCount,
      galleryCount,
      subClanCount,
    };
  }
}
