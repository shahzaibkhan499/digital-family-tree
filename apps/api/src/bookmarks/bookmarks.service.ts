import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

@Injectable()
export class BookmarksService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
  ) {}

  async create(userId: string, dto: CreateBookmarkDto) {
    const existing = await this.prisma.bookmark.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: dto.entityType,
          entityId: dto.entityId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Already bookmarked');
    }

    const id = await this.identityService.generateBookmarkId();

    const bookmark = await this.prisma.bookmark.create({
      data: {
        id,
        userId,
        entityType: dto.entityType,
        entityId: dto.entityId,
      },
    });

    return bookmark;
  }

  async findByUser(
    userId: string,
    entityType?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const where: any = { userId };

    if (entityType) {
      where.entityType = entityType;
    }

    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bookmark.count({ where }),
    ]);

    return {
      bookmarks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async check(userId: string, entityType: string, entityId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_entityType_entityId: { userId, entityType, entityId },
      },
    });

    return { isBookmarked: !!bookmark, bookmarkId: bookmark?.id || null };
  }

  async delete(userId: string, id: string) {
    const bookmark = await this.prisma.bookmark.findUnique({ where: { id } });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    if (bookmark.userId !== userId) {
      throw new BadRequestException('Cannot delete bookmarks of other users');
    }

    await this.prisma.bookmark.delete({ where: { id } });

    return { message: 'Bookmark deleted successfully' };
  }
}
