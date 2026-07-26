import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateClanGalleryDto } from './dto/create-clan-gallery.dto';
import { UpdateClanGalleryDto } from './dto/update-clan-gallery.dto';
import { AuthorizationService } from '../common/authorization.service';

@Injectable()
export class ClanGalleryService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(userId: string, dto: CreateClanGalleryDto) {
    const clan = await this.prisma.clan.findUnique({ where: { id: dto.clanId } });
    if (!clan) throw new NotFoundException('Clan not found');

    const displayId = await this.identityService.generateClanGalleryId();

    return this.prisma.clanGallery.create({
      data: {
        displayId,
        clanId: dto.clanId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        url: dto.url,
        thumbnailUrl: dto.thumbnailUrl,
        uploadedById: userId,
      },
      include: { uploadedBy: true, clan: true },
    });
  }

  async findAllByClan(clanId: string, type?: string, verified?: string) {
    const where: any = { clanId };
    if (type) where.type = type;
    if (verified !== undefined) where.verified = verified === 'true';

    return this.prisma.clanGallery.findMany({
      where,
      include: { uploadedBy: true },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const gallery = await this.prisma.clanGallery.findUnique({
      where: { id },
      include: { uploadedBy: true, clan: true },
    });
    if (!gallery) throw new NotFoundException('Clan gallery item not found');
    return gallery;
  }

  async update(id: string, dto: UpdateClanGalleryDto, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireClanOwnerOrAdmin(userId, existing.clanId);

    return this.prisma.clanGallery.update({
      where: { id },
      data: dto,
      include: { uploadedBy: true, clan: true },
    });
  }

  async delete(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireClanOwnerOrAdmin(userId, existing.clanId);
    return this.prisma.clanGallery.delete({ where: { id } });
  }
}
