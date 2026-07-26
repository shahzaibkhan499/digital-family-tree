import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { AuthorizationService } from '../common/authorization.service';

@Injectable()
export class ClanDirectoryService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async join(userId: string, clanId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) throw new NotFoundException('Clan not found');

    const existing = await this.prisma.clanDirectory.findUnique({
      where: { clanId_userId: { clanId, userId } },
    });
    if (existing) throw new ConflictException('Already a member of this clan');

    const displayId = await this.identityService.generateClanDirectoryId();

    return this.prisma.clanDirectory.create({
      data: {
        displayId,
        clanId,
        userId,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
      include: { user: true, clan: true },
    });
  }

  async findAllByClan(
    clanId: string,
    role?: string,
    verified?: string,
    status?: string,
    search?: string,
  ) {
    const where: any = { clanId };
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

    return this.prisma.clanDirectory.findMany({
      where,
      include: { user: true },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const entry = await this.prisma.clanDirectory.findUnique({
      where: { id },
      include: { user: true, clan: true, verifiedBy: true },
    });
    if (!entry) throw new NotFoundException('Directory entry not found');
    return entry;
  }

  async updateRole(id: string, dto: { role?: string; status?: string; notes?: string }, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireClanOwnerOrAdmin(userId, existing.clanId);

    return this.prisma.clanDirectory.update({
      where: { id },
      data: dto,
      include: { user: true, clan: true },
    });
  }

  async verify(id: string, verifiedById: string) {
    const entry = await this.findOne(id);

    return this.prisma.clanDirectory.update({
      where: { id },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verifiedById,
      },
      include: { user: true, clan: true, verifiedBy: true },
    });
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (userId) await this.authorizationService.requireClanOwnerOrAdmin(userId, existing.clanId);
    return this.prisma.clanDirectory.delete({ where: { id } });
  }

  async getStats(clanId: string) {
    const total = await this.prisma.clanDirectory.count({ where: { clanId } });
    const active = await this.prisma.clanDirectory.count({ where: { clanId, status: 'ACTIVE' } });
    const verified = await this.prisma.clanDirectory.count({ where: { clanId, verified: true } });
    const pending = await this.prisma.clanDirectory.count({ where: { clanId, status: 'PENDING' } });

    const byRole = await this.prisma.clanDirectory.groupBy({
      by: ['role'],
      where: { clanId },
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
