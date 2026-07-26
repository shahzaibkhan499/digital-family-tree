import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscoveryService {
  constructor(private prisma: PrismaService) {}

  async discoverForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        displayName: true,
        city: true,
        country: true,
        occupation: true,
        education: true,
        email: true,
      },
    });

    if (!user) return [];

    const userFamilies = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const userFamilyIds = userFamilies.map(f => f.id);

    const userMembers = await this.prisma.familyMember.findMany({
      where: { familyId: { in: userFamilyIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        familyId: true,
      },
    });

    const userLastNames = new Set<string>();
    for (const member of userMembers) {
      if (member.lastName) userLastNames.add(member.lastName.toLowerCase());
    }
    if (user.lastName) userLastNames.add(user.lastName.toLowerCase());

    const existingRecommendations = await this.prisma.discoveryRecommendation.findMany({
      where: { userId },
      select: { targetId: true, targetType: true },
    });

    const existingKeys = new Set(
      existingRecommendations.map(r => `${r.targetType}:${r.targetId}`),
    );

    const recommendations: any[] = [];

    const surnameFamilies = await this.prisma.family.findMany({
      where: {
        id: { notIn: userFamilyIds },
      },
      include: {
        owner: {
          select: { id: true, name: true, city: true, country: true },
        },
        _count: { select: { members: true } },
      },
    });

    for (const family of surnameFamilies) {
      const familyNameParts = family.name.toLowerCase().split(/\s+/);
      const hasSharedSurname = familyNameParts.some(part => userLastNames.has(part));

      if (hasSharedSurname && !existingKeys.has(`FAMILY:${family.id}`)) {
        const score = this.calculateConfidenceScore(
          { city: user.city, country: user.country, occupation: user.occupation, education: user.education, lastName: user.lastName },
          { city: family.owner?.city, country: family.owner?.country, occupation: undefined, education: undefined, lastName: undefined },
        );
        if (score > 15) {
          recommendations.push({
            targetType: 'FAMILY',
            targetId: family.id,
            confidenceScore: Math.min(score + 25, 100),
            matchFactors: { sharedSurname: true, familyName: family.name, memberCount: family._count.members },
          });
        }
      }
    }

    const cityCountryConditions: any[] = [];
    if (user.city) {
      cityCountryConditions.push({ city: { equals: user.city, mode: 'insensitive' } });
    }
    if (user.country) {
      cityCountryConditions.push({ country: { equals: user.country, mode: 'insensitive' } });
    }

    if (cityCountryConditions.length > 0) {
      const nearbyUsers = await this.prisma.user.findMany({
        where: {
          id: { not: userId },
          deletedAt: null,
          accountStatus: 'active',
          OR: cityCountryConditions,
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          avatar: true,
          city: true,
          country: true,
          occupation: true,
        },
        take: 50,
      });

      for (const targetUser of nearbyUsers) {
        if (!existingKeys.has(`USER:${targetUser.id}`)) {
          const score = this.calculateConfidenceScore(
            { city: user.city, country: user.country, occupation: user.occupation, education: user.education, lastName: user.lastName },
            { city: targetUser.city, country: targetUser.country, occupation: targetUser.occupation, education: undefined, lastName: undefined },
          );
          if (score > 10) {
            const factors: Record<string, any> = {};
            if (user.city && targetUser.city && user.city.toLowerCase() === targetUser.city.toLowerCase()) factors.sameCity = true;
            if (user.country && targetUser.country && user.country.toLowerCase() === targetUser.country.toLowerCase()) factors.sameCountry = true;
            if (user.occupation && targetUser.occupation && user.occupation.toLowerCase() === targetUser.occupation.toLowerCase()) factors.sameOccupation = true;

            recommendations.push({
              targetType: 'USER',
              targetId: targetUser.id,
              confidenceScore: Math.min(score, 100),
              matchFactors: factors,
            });
          }
        }
      }
    }

    const crossFamilyMembers = await this.prisma.familyMember.findMany({
      where: {
        familyId: { notIn: userFamilyIds },
      },
      include: {
        family: { select: { id: true, name: true } },
      },
      take: 500,
    });

    for (const member of crossFamilyMembers) {
      if (existingKeys.has(`MEMBER:${member.id}`)) continue;

      let score = 0;
      const factors: Record<string, any> = {};

      const memberFullName = `${member.firstName} ${member.lastName}`.toLowerCase().trim();
      const userFullName = (user.displayName || user.name || '').toLowerCase().trim();
      if (userFullName && memberFullName && userFullName === memberFullName) {
        score += 35;
        factors.exactNameMatch = true;
      }

      if (member.lastName && userLastNames.has(member.lastName.toLowerCase())) {
        score += 20;
        factors.sharedSurname = true;
      }

      if (user.city && member.city && user.city.toLowerCase() === member.city.toLowerCase()) {
        score += 15;
        factors.sameCity = true;
      }

      if (user.country && member.country && user.country.toLowerCase() === member.country.toLowerCase()) {
        score += 10;
        factors.sameCountry = true;
      }

      if (user.occupation && member.occupation && user.occupation.toLowerCase() === member.occupation.toLowerCase()) {
        score += 10;
        factors.sameOccupation = true;
      }

      if (score >= 15) {
        recommendations.push({
          targetType: 'MEMBER',
          targetId: member.id,
          confidenceScore: Math.min(score, 100),
          matchFactors: { ...factors, memberName: `${member.firstName} ${member.lastName}`, familyName: member.family.name },
        });
      }
    }

    recommendations.sort((a, b) => b.confidenceScore - a.confidenceScore);

    if (user.country) {
      const countryClans = await this.prisma.clan.findMany({
        where: {
          country: { equals: user.country, mode: 'insensitive' },
          status: 'ACTIVE',
        },
        include: {
          owner: { select: { id: true, name: true, city: true, country: true } },
          _count: { select: { families: true } },
        },
        take: 20,
      });

      for (const clan of countryClans) {
        if (existingKeys.has(`CLAN:${clan.id}`)) continue;

        const score = this.calculateConfidenceScore(
          { city: user.city, country: user.country, occupation: user.occupation, education: user.education, lastName: user.lastName },
          { city: user.city, country: clan.country, occupation: undefined, education: undefined, lastName: undefined },
        );
        if (score > 10) {
          recommendations.push({
            targetType: 'CLAN',
            targetId: clan.id,
            confidenceScore: Math.min(score + 15, 100),
            matchFactors: { sameCountry: true, clanName: clan.name, familyCount: clan._count.families },
          });
        }
      }
    }

    for (const rec of recommendations.slice(0, 50)) {
      const existing = await this.prisma.discoveryRecommendation.findFirst({
        where: { userId, targetType: rec.targetType, targetId: rec.targetId },
      });

      if (!existing) {
        await this.prisma.discoveryRecommendation.create({
          data: {
            userId,
            targetType: rec.targetType,
            targetId: rec.targetId,
            confidenceScore: rec.confidenceScore,
            matchFactors: rec.matchFactors,
          },
        });
      }
    }

    const allRecommendations = await this.prisma.discoveryRecommendation.findMany({
      where: { userId },
      orderBy: { confidenceScore: 'desc' },
      take: 50,
    });

    return this.hydrateRecommendations(allRecommendations);
  }

  async getDiscoveryStats(userId: string) {
    const total = await this.prisma.discoveryRecommendation.count({ where: { userId } });
    const viewed = await this.prisma.discoveryRecommendation.count({ where: { userId, viewed: true } });
    const unviewed = total - viewed;

    const byType = await this.prisma.discoveryRecommendation.groupBy({
      by: ['targetType'],
      where: { userId },
      _count: { id: true },
      _avg: { confidenceScore: true },
    });

    return {
      total,
      viewed,
      unviewed,
      byType: byType.map(t => ({
        type: t.targetType,
        count: t._count.id,
        avgConfidence: Math.round((t._avg.confidenceScore || 0) * 100) / 100,
      })),
    };
  }

  async markViewed(userId: string, recommendationId: string) {
    const recommendation = await this.prisma.discoveryRecommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!recommendation || recommendation.userId !== userId) {
      return null;
    }

    return this.prisma.discoveryRecommendation.update({
      where: { id: recommendationId },
      data: { viewed: true },
    });
  }

  calculateConfidenceScore(user: any, target: any): number {
    let score = 0;

    const userSurname = (user.lastName || '').toLowerCase().trim();
    const targetLastName = (target.lastName || '').toLowerCase().trim();

    if (userSurname && targetLastName && userSurname === targetLastName) {
      score += 30;
    }

    if (user.city && target.city && user.city.toLowerCase().trim() === target.city.toLowerCase().trim()) {
      score += 20;
    }

    if (user.country && target.country && user.country.toLowerCase().trim() === target.country.toLowerCase().trim()) {
      score += 15;
    }

    if (user.occupation && target.occupation && user.occupation.toLowerCase().trim() === target.occupation.toLowerCase().trim()) {
      score += 10;
    }

    if (user.education && target.education && user.education.toLowerCase().trim() === target.education.toLowerCase().trim()) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  private async hydrateRecommendations(recommendations: any[]) {
    const hydrated = [];

    for (const rec of recommendations) {
      let targetData: any = null;

      switch (rec.targetType) {
        case 'USER': {
          const userData = await this.prisma.user.findUnique({
            where: { id: rec.targetId },
            select: {
              id: true, displayId: true, name: true, displayName: true, avatar: true,
              city: true, country: true, occupation: true,
            },
          });
          if (userData) targetData = userData;
          break;
        }
        case 'MEMBER': {
          const memberData = await this.prisma.familyMember.findUnique({
            where: { id: rec.targetId },
            select: {
              id: true, displayId: true, firstName: true, lastName: true, avatar: true,
              city: true, country: true, occupation: true, birthDate: true, gender: true,
              family: { select: { id: true, name: true, displayId: true } },
            },
          });
          if (memberData) targetData = memberData;
          break;
        }
        case 'FAMILY': {
          const familyData = await this.prisma.family.findUnique({
            where: { id: rec.targetId },
            select: {
              id: true, displayId: true, name: true, description: true,
              owner: { select: { id: true, name: true, avatar: true } },
              _count: { select: { members: true } },
            },
          });
          if (familyData) targetData = familyData;
          break;
        }
        case 'CLAN': {
          const clanData = await this.prisma.clan.findUnique({
            where: { id: rec.targetId },
            select: {
              id: true, displayId: true, name: true, slug: true, description: true,
              country: true, region: true, verified: true, logo: true, banner: true,
              owner: { select: { id: true, name: true, avatar: true } },
              _count: { select: { families: true } },
            },
          });
          if (clanData) targetData = clanData;
          break;
        }
      }

      if (targetData) {
        hydrated.push({
          ...rec,
          target: targetData,
        });
      }
    }

    return hydrated;
  }
}
