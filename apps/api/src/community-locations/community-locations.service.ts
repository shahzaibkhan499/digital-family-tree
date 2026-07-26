import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityLocationDto } from './dto/create-community-location.dto';
import { UpdateCommunityLocationDto } from './dto/update-community-location.dto';
import { AuthorizationService } from '../common/authorization.service';

@Injectable()
export class CommunityLocationsService {
  constructor(
    private prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(dto: CreateCommunityLocationDto) {
    const community = await this.prisma.community.findUnique({ where: { id: dto.communityId } });
    if (!community) throw new NotFoundException('Community not found');

    return this.prisma.communityLocation.create({
      data: {
        communityId: dto.communityId,
        type: dto.type,
        country: dto.country,
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        population: dto.population,
        year: dto.year,
      },
      include: { community: true },
    });
  }

  async findAllByCommunity(communityId: string, type?: string) {
    const where: any = { communityId };
    if (type) where.type = type;

    return this.prisma.communityLocation.findMany({
      where,
      orderBy: { year: 'asc' },
    });
  }

  async findOne(id: string) {
    const location = await this.prisma.communityLocation.findUnique({
      where: { id },
      include: { community: true },
    });
    if (!location) throw new NotFoundException('Community location not found');
    return location;
  }

  async update(id: string, dto: UpdateCommunityLocationDto, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);

    return this.prisma.communityLocation.update({
      where: { id },
      data: dto,
      include: { community: true },
    });
  }

  async delete(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);
    return this.prisma.communityLocation.delete({ where: { id } });
  }

  async getDistribution(communityId: string) {
    const locations = await this.prisma.communityLocation.findMany({
      where: { communityId },
      orderBy: { country: 'asc' },
    });

    const byCountry = locations.reduce((acc, loc) => {
      const existing = acc.find((c) => c.country === loc.country);
      if (existing) {
        existing.count++;
        existing.totalPopulation = (existing.totalPopulation || 0) + (loc.population || 0);
      } else {
        acc.push({
          country: loc.country,
          count: 1,
          totalPopulation: loc.population || 0,
        });
      }
      return acc;
    }, [] as { country: string; count: number; totalPopulation: number }[]);

    const byType = await this.prisma.communityLocation.groupBy({
      by: ['type'],
      where: { communityId },
      _count: { type: true },
    });

    return {
      total: locations.length,
      byCountry,
      byType: byType.map((t) => ({ type: t.type, count: t._count.type })),
    };
  }
}
