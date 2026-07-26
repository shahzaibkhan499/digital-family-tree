import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateClanDocumentDto } from './dto/create-clan-document.dto';
import { UpdateClanDocumentDto } from './dto/update-clan-document.dto';
import { AuthorizationService } from '../common/authorization.service';

@Injectable()
export class ClanDocumentsService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(userId: string, dto: CreateClanDocumentDto) {
    const clan = await this.prisma.clan.findUnique({ where: { id: dto.clanId } });
    if (!clan) throw new NotFoundException('Clan not found');

    const displayId = await this.identityService.generateClanDocumentId();

    return this.prisma.clanDocument.create({
      data: {
        displayId,
        clanId: dto.clanId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        fileUrl: dto.fileUrl,
        authorId: userId,
        status: 'ACTIVE',
      },
      include: { author: true, clan: true },
    });
  }

  async findAllByClan(clanId: string, type?: string, verified?: string, status?: string) {
    const where: any = { clanId };
    if (type) where.type = type;
    if (verified !== undefined) where.verified = verified === 'true';
    if (status) where.status = status;

    return this.prisma.clanDocument.findMany({
      where,
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.clanDocument.findUnique({
      where: { id },
      include: { author: true, clan: true },
    });
    if (!document) throw new NotFoundException('Clan document not found');
    return document;
  }

  async update(id: string, dto: UpdateClanDocumentDto, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireClanOwnerOrAdmin(userId, existing.clanId);

    return this.prisma.clanDocument.update({
      where: { id },
      data: dto,
      include: { author: true, clan: true },
    });
  }

  async delete(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireClanOwnerOrAdmin(userId, existing.clanId);
    return this.prisma.clanDocument.delete({ where: { id } });
  }
}
