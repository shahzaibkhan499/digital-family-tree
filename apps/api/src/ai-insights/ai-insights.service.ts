import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiInsightsService {
  constructor(private prisma: PrismaService) {}

  async getCommunityInsights(communityId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const insights = await this.prisma.communityAISummary.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
    });

    return insights;
  }

  async getClanInsights(clanId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const insights = await this.prisma.clanAISummary.findMany({
      where: { clanId },
      orderBy: { createdAt: 'desc' },
    });

    return insights;
  }

  async storeCommunityInsight(communityId: string, type: string, content: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const existingInsight = await this.prisma.communityAISummary.findFirst({
      where: { communityId, type },
      orderBy: { version: 'desc' },
    });

    const version = existingInsight ? existingInsight.version + 1 : 1;

    const insight = await this.prisma.communityAISummary.create({
      data: {
        communityId,
        type,
        content,
        version,
      },
    });

    return insight;
  }

  async storeClanInsight(clanId: string, type: string, content: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const existingInsight = await this.prisma.clanAISummary.findFirst({
      where: { clanId, type },
      orderBy: { version: 'desc' },
    });

    const version = existingInsight ? existingInsight.version + 1 : 1;

    const insight = await this.prisma.clanAISummary.create({
      data: {
        clanId,
        type,
        content,
        version,
      },
    });

    return insight;
  }
}
