import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClanLocationDto } from './dto/create-clan-location.dto';
import { UpdateClanLocationDto } from './dto/update-clan-location.dto';
import { AuthorizationService } from '../common/authorization.service';

@Injectable()
export class ClanLocationsService {
  constructor(
    private prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(dto: CreateClanLocationDto) {
    const clan = await this.prisma.clan.findUnique({ where: { id: dto.clanId } });
    if (!clan) throw new NotFoundException('Clan not found');

    return this.prisma.clanLocation.create({
      data: {
        clanId: dto.clanId,
        type: dto.type,
        country: dto.country,
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        population: dto.population,
        year: dto.year,
      },
      include: { clan: true },
    });
  }

  async findAllByClan(clanId: string, type?: string) {
    const where: any = { clanId };
    if (type) where.type = type;

    return this.prisma.clanLocation.findMany({
      where,
      orderBy: { year: 'asc' },
    });
  }

  async findOne(id: string) {
    const location = await this.prisma.clanLocation.findUnique({
      where: { id },
      include: { clan: true },
    });
    if (!location) throw new NotFoundException('Clan location not found');
    return location;
  }

  async update(id: string, dto: UpdateClanLocationDto, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireClanOwnerOrAdmin(userId, existing.clanId);

    return this.prisma.clanLocation.update({
      where: { id },
      data: dto,
      include: { clan: true },
    });
  }

  async delete(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireClanOwnerOrAdmin(userId, existing.clanId);
    return this.prisma.clanLocation.delete({ where: { id } });
  }

  async getDistribution(clanId: string) {
    const locations = await this.prisma.clanLocation.findMany({
      where: { clanId },
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

    const byType = await this.prisma.clanLocation.groupBy({
      by: ['type'],
      where: { clanId },
      _count: { type: true },
    });

    return {
      total: locations.length,
      byCountry,
      byType: byType.map((t) => ({ type: t.type, count: t._count.type })),
    };
  }
}
