import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateCommunityDocumentDto } from './dto/create-community-document.dto';
import { UpdateCommunityDocumentDto } from './dto/update-community-document.dto';
import { AuthorizationService } from '../common/authorization.service';

@Injectable()
export class CommunityDocumentsService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(userId: string, dto: CreateCommunityDocumentDto) {
    const community = await this.prisma.community.findUnique({ where: { id: dto.communityId } });
    if (!community) throw new NotFoundException('Community not found');

    const displayId = await this.identityService.generateCommunityDocumentId();

    return this.prisma.communityDocument.create({
      data: {
        displayId,
        communityId: dto.communityId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        fileUrl: dto.fileUrl,
        authorId: userId,
        status: 'ACTIVE',
      },
      include: { author: true, community: true },
    });
  }

  async findAllByCommunity(communityId: string, type?: string, verified?: string, status?: string) {
    const where: any = { communityId };
    if (type) where.type = type;
    if (verified !== undefined) where.verified = verified === 'true';
    if (status) where.status = status;

    return this.prisma.communityDocument.findMany({
      where,
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.communityDocument.findUnique({
      where: { id },
      include: { author: true, community: true },
    });
    if (!document) throw new NotFoundException('Community document not found');
    return document;
  }

  async update(id: string, dto: UpdateCommunityDocumentDto, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);

    return this.prisma.communityDocument.update({
      where: { id },
      data: dto,
      include: { author: true, community: true },
    });
  }

  async delete(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);
    return this.prisma.communityDocument.delete({ where: { id } });
  }
}
