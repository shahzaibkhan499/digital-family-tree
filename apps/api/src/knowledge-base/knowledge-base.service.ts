import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
  ) {}

  async create(userId: string, dto: CreateKnowledgeBaseDto) {
    const id = await this.identityService.generateKnowledgeBaseId();

    const entry = await this.prisma.knowledgeBase.create({
      data: {
        id,
        entityType: dto.entityType,
        entityId: dto.entityId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        authorId: userId,
        status: dto.status || 'PUBLISHED',
        publishedAt: dto.status === 'DRAFT' ? null : new Date(),
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    return entry;
  }

  async findAll(
    entityType?: string,
    entityId?: string,
    type?: string,
    status?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [entries, total] = await Promise.all([
      this.prisma.knowledgeBase.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.knowledgeBase.count({ where }),
    ]);

    return {
      entries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByEntity(entityType: string, entityId: string) {
    const entries = await this.prisma.knowledgeBase.findMany({
      where: { entityType, entityId },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return entries;
  }

  async findOne(id: string) {
    const entry = await this.prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!entry) {
      throw new NotFoundException('Knowledge base entry not found');
    }

    return entry;
  }

  async update(id: string, userId: string, dto: UpdateKnowledgeBaseDto) {
    const entry = await this.prisma.knowledgeBase.findUnique({ where: { id } });

    if (!entry) {
      throw new NotFoundException('Knowledge base entry not found');
    }

    if (entry.authorId !== userId) {
      throw new ForbiddenException('You can only update your own entries');
    }

    const updateData: any = { ...dto };

    if (dto.status === 'PUBLISHED' && entry.status === 'DRAFT') {
      updateData.publishedAt = new Date();
    }

    const updated = await this.prisma.knowledgeBase.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    return updated;
  }

  async delete(id: string, userId: string) {
    const entry = await this.prisma.knowledgeBase.findUnique({ where: { id } });

    if (!entry) {
      throw new NotFoundException('Knowledge base entry not found');
    }

    if (entry.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own entries');
    }

    await this.prisma.knowledgeBase.delete({ where: { id } });

    return { message: 'Knowledge base entry deleted successfully' };
  }
}
