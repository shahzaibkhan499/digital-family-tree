import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { AuthorizationService } from '../common/authorization.service';

@Injectable()
export class CommunityDirectoryService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async join(userId: string, communityId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundException('Community not found');

    const existing = await this.prisma.communityDirectory.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (existing) throw new ConflictException('Already a member of this community');

    const displayId = await this.identityService.generateCommunityDirectoryId();

    return this.prisma.communityDirectory.create({
      data: {
        displayId,
        communityId,
        userId,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
      include: { user: true, community: true },
    });
  }

  async findAllByCommunity(
    communityId: string,
    role?: string,
    verified?: string,
    status?: string,
    search?: string,
  ) {
    const where: any = { communityId };
    if (role) where.role = role;
    if (verified !== undefined) where.verified = verified === 'true';
    if (status) where.status = status;
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.communityDirectory.findMany({
      where,
      include: { user: true },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const entry = await this.prisma.communityDirectory.findUnique({
      where: { id },
      include: { user: true, community: true, verifiedBy: true },
    });
    if (!entry) throw new NotFoundException('Directory entry not found');
    return entry;
  }

  async updateRole(id: string, dto: { role?: string; status?: string; notes?: string }, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);

    return this.prisma.communityDirectory.update({
      where: { id },
      data: dto,
      include: { user: true, community: true },
    });
  }

  async verify(id: string, verifiedById: string) {
    const entry = await this.findOne(id);

    return this.prisma.communityDirectory.update({
      where: { id },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verifiedById,
      },
      include: { user: true, community: true, verifiedBy: true },
    });
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireCommunityOwnerOrAdmin(userId, existing.communityId);
    return this.prisma.communityDirectory.delete({ where: { id } });
  }

  async getStats(communityId: string) {
    const total = await this.prisma.communityDirectory.count({ where: { communityId } });
    const active = await this.prisma.communityDirectory.count({ where: { communityId, status: 'ACTIVE' } });
    const verified = await this.prisma.communityDirectory.count({ where: { communityId, verified: true } });
    const pending = await this.prisma.communityDirectory.count({ where: { communityId, status: 'PENDING' } });

    const byRole = await this.prisma.communityDirectory.groupBy({
      by: ['role'],
      where: { communityId },
      _count: { role: true },
    });

    return {
      total,
      active,
      verified,
      pending,
      byRole: byRole.map((r) => ({ role: r.role, count: r._count.role })),
    };
  }
}
