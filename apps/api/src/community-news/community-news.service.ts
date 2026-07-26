import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateCommunityNewsDto } from './dto/create-community-news.dto';
import { UpdateCommunityNewsDto } from './dto/update-community-news.dto';
import { AuthorizationService } from '../common/authorization.service';

@Injectable()
export class CommunityNewsService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(userId: string, dto: CreateCommunityNewsDto) {
    const community = await this.prisma.community.findUnique({ where: { id: dto.communityId } });
    if (!community) throw new NotFoundException('Community not found');

    const displayId = await this.identityService.generateCommunityNewsId();

    return this.prisma.communityNews.create({
      data: {
        displayId,
        communityId: dto.communityId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        authorId: userId,
        featured: dto.featured ?? false,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      include: { author: true, community: true },
    });
  }

  async findAllByCommunity(communityId: string, type?: string, status?: string, featured?: string) {
    const where: any = { communityId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (featured !== undefined) where.featured = featured === 'true';

    return this.prisma.communityNews.findMany({
      where,
      include: { author: true },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const news = await this.prisma.communityNews.findUnique({
      where: { id },
      include: { author: true, community: true },
    });
    if (!news) throw new NotFoundException('Community news not found');
    return news;
  }

  async update(id: string, dto: UpdateCommunityNewsDto, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);

    return this.prisma.communityNews.update({
      where: { id },
      data: dto,
      include: { author: true, community: true },
    });
  }

  async delete(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);
    return this.prisma.communityNews.delete({ where: { id } });
  }
}
