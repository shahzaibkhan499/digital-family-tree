import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { PermissionsService } from '../common/permissions.service';
import { CreateMemoryDto, UpdateMemoryDto, CreateMemoryCommentDto, CreateMemoryReactionDto } from './dto/create-memory.dto';

@Injectable()
export class MemoryService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private permissionsService: PermissionsService,
  ) {}

  async create(userId: string, dto: CreateMemoryDto) {
    const family = await this.prisma.family.findUnique({ where: { id: dto.familyId } });
    if (!family) throw new NotFoundException('Family not found');
    if (family.ownerId !== userId) throw new ForbiddenException('You do not have access to this family');

    const displayId = await this.identityService.generateMemoryId();

    const memory = await this.prisma.memory.create({
      data: {
        displayId,
        title: dto.title,
        description: dto.description,
        story: dto.story,
        date: dto.date ? new Date(dto.date) : null,
        location: dto.location,
        visibility: (dto.visibility || 'FAMILY') as any,
        tags: dto.tags,
        userId,
        familyId: dto.familyId,
        subClanId: dto.subClanId || null,
        clanId: dto.clanId || null,
        communityId: dto.communityId || null,
        media: dto.media ? {
          create: dto.media.map((m, i) => ({
            url: m.url,
            type: m.type || 'IMAGE',
            alt: m.alt,
            order: i,
          })),
        } : undefined,
        members: dto.memberIds ? {
          create: dto.memberIds.map(memberId => ({ memberId })),
        } : undefined,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, displayId: true } },
        family: { select: { id: true, name: true } },
        media: { orderBy: { order: 'asc' } },
        members: { include: { member: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
        _count: { select: { comments: true, reactions: true } },
      },
    });

    return memory;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    familyId?: string;
    memberId?: string;
    tag?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
    userId?: string;
    visibility?: string;
    viewerId?: string;
  } = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      familyId,
      memberId,
      tag,
      location,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      visibility,
      viewerId,
    } = options;

    const filters: Record<string, unknown> = { isHidden: false };
    if (familyId) filters.familyId = familyId;
    if (userId) filters.userId = userId;
    if (location) filters.location = { contains: location, mode: 'insensitive' };
    if (dateFrom || dateTo) {
      filters.date = {};
      if (dateFrom) (filters.date as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (filters.date as Record<string, unknown>).lte = new Date(dateTo);
    }
    if (tag) filters.tags = { contains: tag, mode: 'insensitive' };
    if (visibility) {
      filters.visibility = visibility;
    }
    if (memberId) {
      filters.members = { some: { memberId } };
    }

    const andConditions: any[] = [filters];

    if (viewerId) {
      const visibleFamilyIds = await this.permissionsService.getVisibleFamilyIds(viewerId);
      const visibleSubClanIds = await this.permissionsService.getVisibleSubClanIds(viewerId);
      const visibleClanIds = await this.permissionsService.getVisibleClanIds(viewerId);
      const visibleCommunityIds = await this.permissionsService.getVisibleCommunityIds(viewerId);

      andConditions.push({
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'ONLY_ME', userId: viewerId },
          { visibility: 'FAMILY', familyId: { in: visibleFamilyIds } },
          { visibility: 'SUB_CLAN', subClanId: { in: visibleSubClanIds } },
          { visibility: 'CLAN', clanId: { in: visibleClanIds } },
          { visibility: 'COMMUNITY', communityId: { in: visibleCommunityIds } },
        ],
      });
    }

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { story: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { tags: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where = { AND: andConditions } as never;

    const orderBy: Record<string, string> = { [sortBy]: sortOrder };

    const [memories, total] = await Promise.all([
      this.prisma.memory.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true, displayId: true } },
          family: { select: { id: true, name: true } },
          media: { orderBy: { order: 'asc' } },
          members: { include: { member: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
          _count: { select: { comments: true, reactions: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      this.prisma.memory.count({ where }),
    ]);

    return {
      memories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, viewerId?: string) {
    const memory = await this.prisma.memory.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatar: true, displayId: true } },
        family: { select: { id: true, name: true } },
        media: { orderBy: { order: 'asc' } },
        members: { include: { member: { select: { id: true, firstName: true, lastName: true, avatar: true, displayId: true } } } },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        reactions: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        _count: { select: { comments: true, reactions: true } },
      },
    });

    if (!memory) throw new NotFoundException('Memory not found');

    if (viewerId && memory.visibility !== 'PUBLIC') {
      const canView = await this.permissionsService.canViewMemory(viewerId, memory);
      if (!canView) throw new ForbiddenException('You do not have permission to view this memory');
    }

    return memory;
  }

  async update(id: string, userId: string, dto: UpdateMemoryDto) {
    const memory = await this.prisma.memory.findUnique({ where: { id } });
    if (!memory) throw new NotFoundException('Memory not found');
    if (memory.userId !== userId) throw new ForbiddenException('You can only edit your own memories');

    return this.prisma.memory.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.story !== undefined && { story: dto.story }),
        ...(dto.date !== undefined && { date: dto.date ? new Date(dto.date) : null }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility as any }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, displayId: true } },
        family: { select: { id: true, name: true } },
        media: { orderBy: { order: 'asc' } },
        members: { include: { member: { select: { id: true, firstName: true, lastName: true } } } },
        _count: { select: { comments: true, reactions: true } },
      },
    });
  }

  async remove(id: string, userId: string, isAdmin = false) {
    const memory = await this.prisma.memory.findUnique({ where: { id } });
    if (!memory) throw new NotFoundException('Memory not found');
    if (!isAdmin && memory.userId !== userId) throw new ForbiddenException('You can only delete your own memories');

    await this.prisma.memory.delete({ where: { id } });
    return { message: 'Memory deleted successfully' };
  }

  async hide(id: string) {
    const memory = await this.prisma.memory.findUnique({ where: { id } });
    if (!memory) throw new NotFoundException('Memory not found');

    return this.prisma.memory.update({
      where: { id },
      data: { isHidden: true },
    });
  }

  async restore(id: string) {
    const memory = await this.prisma.memory.findUnique({ where: { id } });
    if (!memory) throw new NotFoundException('Memory not found');

    return this.prisma.memory.update({
      where: { id },
      data: { isHidden: false },
    });
  }

  async getStats() {
    const [total, todayCount, weekCount, monthCount, hiddenCount] = await Promise.all([
      this.prisma.memory.count({ where: { isHidden: false } }),
      this.prisma.memory.count({ where: { isHidden: false, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      this.prisma.memory.count({ where: { isHidden: false, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      this.prisma.memory.count({ where: { isHidden: false, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      this.prisma.memory.count({ where: { isHidden: true } }),
    ]);

    const byVisibility = await this.prisma.memory.groupBy({
      by: ['visibility'],
      _count: { id: true },
      where: { isHidden: false },
    });

    return { total, todayCount, weekCount, monthCount, hiddenCount, byVisibility: byVisibility.map(v => ({ visibility: v.visibility, count: v._count.id })) };
  }

  async findByFamily(familyId: string, options: { page?: number; limit?: number; sortBy?: string; sortOrder?: string } = {}) {
    const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc' } = options;
    const where = { familyId, isHidden: false };
    const orderBy: Record<string, string> = { [sortBy]: sortOrder };

    const [memories, total] = await Promise.all([
      this.prisma.memory.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          media: { orderBy: { order: 'asc' } },
          members: { include: { member: { select: { id: true, firstName: true, lastName: true } } } },
          _count: { select: { comments: true, reactions: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      this.prisma.memory.count({ where }),
    ]);

    return { memories, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByMember(memberId: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = options;

    const [memories, total] = await Promise.all([
      this.prisma.memory.findMany({
        where: { members: { some: { memberId } }, isHidden: false },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          family: { select: { id: true, name: true } },
          media: { orderBy: { order: 'asc' } },
          _count: { select: { comments: true, reactions: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.memory.count({ where: { members: { some: { memberId } }, isHidden: false } }),
    ]);

    return { memories, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async addComment(memoryId: string, userId: string, dto: CreateMemoryCommentDto) {
    const memory = await this.prisma.memory.findUnique({ where: { id: memoryId } });
    if (!memory) throw new NotFoundException('Memory not found');

    return this.prisma.memoryComment.create({
      data: { memoryId, userId, content: dto.content },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async removeComment(memoryId: string, commentId: string, userId: string) {
    const comment = await this.prisma.memoryComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.memoryId !== memoryId) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('You can only delete your own comments');

    await this.prisma.memoryComment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted successfully' };
  }

  async toggleReaction(memoryId: string, userId: string, dto: CreateMemoryReactionDto) {
    const memory = await this.prisma.memory.findUnique({ where: { id: memoryId } });
    if (!memory) throw new NotFoundException('Memory not found');

    const reactionType = dto.type || 'LIKE';
    const existing = await this.prisma.memoryReaction.findUnique({
      where: { memoryId_userId_type: { memoryId, userId, type: reactionType } },
    });

    if (existing) {
      await this.prisma.memoryReaction.delete({ where: { id: existing.id } });
      return { removed: true, type: reactionType };
    }

    const reaction = await this.prisma.memoryReaction.create({
      data: { memoryId, userId, type: reactionType },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    return { removed: false, reaction };
  }
}
