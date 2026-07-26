import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateClanEventDto } from './dto/create-clan-event.dto';
import { UpdateClanEventDto } from './dto/update-clan-event.dto';
import { AuthorizationService } from '../common/authorization.service';

@Injectable()
export class ClanEventsService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(userId: string, dto: CreateClanEventDto) {
    const clan = await this.prisma.clan.findUnique({ where: { id: dto.clanId } });
    if (!clan) throw new NotFoundException('Clan not found');

    const displayId = await this.identityService.generateClanEventId();

    return this.prisma.clanEvent.create({
      data: {
        displayId,
        clanId: dto.clanId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        location: dto.location,
        isVirtual: dto.isVirtual ?? false,
        meetingUrl: dto.meetingUrl,
        organizerId: userId,
        maxAttendees: dto.maxAttendees,
      },
      include: { organizer: true, clan: true },
    });
  }

  async findAllByClan(clanId: string, type?: string, status?: string, upcoming?: string) {
    const where: any = { clanId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (upcoming === 'true') {
      where.startDate = { gte: new Date() };
      where.status = 'UPCOMING';
    }

    return this.prisma.clanEvent.findMany({
      where,
      include: { organizer: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.clanEvent.findUnique({
      where: { id },
      include: { organizer: true, clan: true },
    });
    if (!event) throw new NotFoundException('Clan event not found');
    return event;
  }

  async update(id: string, dto: UpdateClanEventDto, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireClanOwnerOrAdmin(userId, existing.clanId);

    return this.prisma.clanEvent.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { organizer: true, clan: true },
    });
  }

  async delete(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireClanOwnerOrAdmin(userId, existing.clanId);
    return this.prisma.clanEvent.delete({ where: { id } });
  }

  async getStats(clanId: string) {
    const total = await this.prisma.clanEvent.count({ where: { clanId } });
    const upcoming = await this.prisma.clanEvent.count({ where: { clanId, status: 'UPCOMING' } });
    const ongoing = await this.prisma.clanEvent.count({ where: { clanId, status: 'ONGOING' } });
    const completed = await this.prisma.clanEvent.count({ where: { clanId, status: 'COMPLETED' } });
    const cancelled = await this.prisma.clanEvent.count({ where: { clanId, status: 'CANCELLED' } });

    const byType = await this.prisma.clanEvent.groupBy({
      by: ['type'],
      where: { clanId },
      _count: { type: true },
    });

    return {
      total,
      upcoming,
      ongoing,
      completed,
      cancelled,
      byType: byType.map((t) => ({ type: t.type, count: t._count.type })),
    };
  }
}
