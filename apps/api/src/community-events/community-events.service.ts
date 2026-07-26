import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateCommunityEventDto } from './dto/create-community-event.dto';
import { UpdateCommunityEventDto } from './dto/update-community-event.dto';
import { AuthorizationService } from '../common/authorization.service';

@Injectable()
export class CommunityEventsService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(userId: string, dto: CreateCommunityEventDto) {
    const community = await this.prisma.community.findUnique({ where: { id: dto.communityId } });
    if (!community) throw new NotFoundException('Community not found');

    const displayId = await this.identityService.generateCommunityEventId();

    return this.prisma.communityEvent.create({
      data: {
        displayId,
        communityId: dto.communityId,
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
      include: { organizer: true, community: true },
    });
  }

  async findAllByCommunity(communityId: string, type?: string, status?: string, upcoming?: string) {
    const where: any = { communityId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (upcoming === 'true') {
      where.startDate = { gte: new Date() };
      where.status = 'UPCOMING';
    }

    return this.prisma.communityEvent.findMany({
      where,
      include: { organizer: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.communityEvent.findUnique({
      where: { id },
      include: { organizer: true, community: true },
    });
    if (!event) throw new NotFoundException('Community event not found');
    return event;
  }

  async update(id: string, dto: UpdateCommunityEventDto, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);

    return this.prisma.communityEvent.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { organizer: true, community: true },
    });
  }

  async delete(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);
    return this.prisma.communityEvent.delete({ where: { id } });
  }

  async getStats(communityId: string) {
    const total = await this.prisma.communityEvent.count({ where: { communityId } });
    const upcoming = await this.prisma.communityEvent.count({ where: { communityId, status: 'UPCOMING' } });
    const ongoing = await this.prisma.communityEvent.count({ where: { communityId, status: 'ONGOING' } });
    const completed = await this.prisma.communityEvent.count({ where: { communityId, status: 'COMPLETED' } });
    const cancelled = await this.prisma.communityEvent.count({ where: { communityId, status: 'CANCELLED' } });

    const byType = await this.prisma.communityEvent.groupBy({
      by: ['type'],
      where: { communityId },
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
