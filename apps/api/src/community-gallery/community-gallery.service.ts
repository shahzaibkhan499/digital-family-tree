import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateCommunityGalleryDto } from './dto/create-community-gallery.dto';
import { UpdateCommunityGalleryDto } from './dto/update-community-gallery.dto';
import { AuthorizationService } from '../common/authorization.service';

@Injectable()
export class CommunityGalleryService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(userId: string, dto: CreateCommunityGalleryDto) {
    const community = await this.prisma.community.findUnique({ where: { id: dto.communityId } });
    if (!community) throw new NotFoundException('Community not found');

    const displayId = await this.identityService.generateCommunityGalleryId();

    return this.prisma.communityGallery.create({
      data: {
        displayId,
        communityId: dto.communityId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        url: dto.url,
        thumbnailUrl: dto.thumbnailUrl,
        uploadedById: userId,
      },
      include: { uploadedBy: true, community: true },
    });
  }

  async findAllByCommunity(communityId: string, type?: string, verified?: string) {
    const where: any = { communityId };
    if (type) where.type = type;
    if (verified !== undefined) where.verified = verified === 'true';

    return this.prisma.communityGallery.findMany({
      where,
      include: { uploadedBy: true },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const gallery = await this.prisma.communityGallery.findUnique({
      where: { id },
      include: { uploadedBy: true, community: true },
    });
    if (!gallery) throw new NotFoundException('Community gallery item not found');
    return gallery;
  }

  async update(id: string, dto: UpdateCommunityGalleryDto, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);

    return this.prisma.communityGallery.update({
      where: { id },
      data: dto,
      include: { uploadedBy: true, community: true },
    });
  }

  async delete(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);
    return this.prisma.communityGallery.delete({ where: { id } });
  }
}
