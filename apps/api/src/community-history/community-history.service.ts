import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateCommunityHistoryDto } from './dto/create-community-history.dto';
import { UpdateCommunityHistoryDto } from './dto/update-community-history.dto';
import { AuthorizationService } from '../common/authorization.service';

@Injectable()
export class CommunityHistoryService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(userId: string, dto: CreateCommunityHistoryDto) {
    const community = await this.prisma.community.findUnique({ where: { id: dto.communityId } });
    if (!community) throw new NotFoundException('Community not found');

    const displayId = await this.identityService.generateCommunityHistoryId();

    return this.prisma.communityHistory.create({
      data: {
        displayId,
        communityId: dto.communityId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        date: dto.date ? new Date(dto.date) : null,
        period: dto.period,
        location: dto.location,
        imageUrl: dto.imageUrl,
        source: dto.source,
        authorId: userId,
      },
      include: { author: true, community: true },
    });
  }

  async findAllByCommunity(communityId: string, type?: string, verified?: string) {
    const where: any = { communityId };
    if (type) where.type = type;
    if (verified !== undefined) where.verified = verified === 'true';

    return this.prisma.communityHistory.findMany({
      where,
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const history = await this.prisma.communityHistory.findUnique({
      where: { id },
      include: { author: true, community: true },
    });
    if (!history) throw new NotFoundException('Community history not found');
    return history;
  }

  async update(id: string, dto: UpdateCommunityHistoryDto, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);

    return this.prisma.communityHistory.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: { author: true, community: true },
    });
  }

  async delete(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);
    return this.prisma.communityHistory.delete({ where: { id } });
  }
}
