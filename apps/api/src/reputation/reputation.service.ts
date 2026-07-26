import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReputationService {
  constructor(private prisma: PrismaService) {}

  async getCommunityReputation(communityId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const reputation = await this.prisma.communityReputation.findUnique({
      where: { communityId },
    });

    if (!reputation) {
      return this.calculateCommunityReputation(communityId);
    }

    return reputation;
  }

  async calculateCommunityReputation(communityId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const [followerCount, clanCount, familyCount, memberCount, eventCount] = await Promise.all([
      this.prisma.communityFollower.count({ where: { communityId } }),
      this.prisma.clan.count({ where: { communityId, deletedAt: null } }),
      this.prisma.family.count({ where: { clan: { communityId }, deletedAt: null } }),
      this.prisma.familyMember.count({
        where: { family: { clan: { communityId } } },
      }),
      this.prisma.communityEvent.count({ where: { communityId } }),
    ]);

    const verifiedClans = await this.prisma.clan.count({
      where: { communityId, verified: true, deletedAt: null },
    });

    const verifiedFamilies = await this.prisma.family.count({
      where: { clan: { communityId }, deletedAt: null },
    });

    const trustScore = Math.min(
      100,
      (verifiedClans * 15) + (verifiedFamilies * 5) + (followerCount * 2),
    );

    const now = new Date();
    const foundedDate = community.foundedDate ? new Date(community.foundedDate) : community.createdAt;
    const yearsActive = Math.max(1, (now.getTime() - foundedDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const heritageScore = Math.min(100, yearsActive * 5 + clanCount * 3);

    const contributionScore = Math.min(100, (memberCount * 1) + (eventCount * 5) + (followerCount * 2));

    const reputationData = {
      trustScore: Math.round(trustScore * 100) / 100,
      heritageScore: Math.round(heritageScore * 100) / 100,
      contributionScore: Math.round(contributionScore * 100) / 100,
      totalFollowers: followerCount,
      totalMembers: memberCount,
      totalFamilies: familyCount,
      totalClans: clanCount,
      lastCalculatedAt: now,
    };

    const reputation = await this.prisma.communityReputation.upsert({
      where: { communityId },
      update: reputationData,
      create: {
        communityId,
        ...reputationData,
      },
    });

    return reputation;
  }

  async getClanReputation(clanId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const reputation = await this.prisma.clanReputation.findUnique({
      where: { clanId },
    });

    if (!reputation) {
      return this.calculateClanReputation(clanId);
    }

    return reputation;
  }

  async calculateClanReputation(clanId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const [familyCount, memberCount, subClanCount, documentCount, historyCount] = await Promise.all([
      this.prisma.family.count({ where: { clanId, deletedAt: null } }),
      this.prisma.familyMember.count({
        where: { family: { clanId } },
      }),
      this.prisma.subClan.count({ where: { clanId, deletedAt: null } }),
      this.prisma.clanDocument.count({ where: { clanId } }),
      this.prisma.clanHistory.count({ where: { clanId } }),
    ]);

    const now = new Date();
    const yearsActive = Math.max(1, (now.getTime() - clan.createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const heritageScore = Math.min(100, yearsActive * 5 + familyCount * 3);

    const preservationScore = Math.min(100, (documentCount * 5) + (historyCount * 3) + (familyCount * 2));

    const reputationData = {
      heritageScore: Math.round(heritageScore * 100) / 100,
      preservationScore: Math.round(preservationScore * 100) / 100,
      totalFamilies: familyCount,
      totalMembers: memberCount,
      totalSubClans: subClanCount,
      lastCalculatedAt: now,
    };

    const reputation = await this.prisma.clanReputation.upsert({
      where: { clanId },
      update: reputationData,
      create: {
        clanId,
        ...reputationData,
      },
    });

    return reputation;
  }

  async getTopCommunities(sort: string = 'trustScore', limit: number = 10) {
    const orderBy: any = {};
    if (sort === 'heritageScore') {
      orderBy.heritageScore = 'desc';
    } else if (sort === 'contributionScore') {
      orderBy.contributionScore = 'desc';
    } else {
      orderBy.trustScore = 'desc';
    }

    const reputations = await this.prisma.communityReputation.findMany({
      orderBy,
      take: limit,
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
    });

    return reputations;
  }

  async getTopClans(sort: string = 'heritageScore', limit: number = 10) {
    const orderBy: any = {};
    if (sort === 'preservationScore') {
      orderBy.preservationScore = 'desc';
    } else {
      orderBy.heritageScore = 'desc';
    }

    const reputations = await this.prisma.clanReputation.findMany({
      orderBy,
      take: limit,
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
    });

    return reputations;
  }
}
