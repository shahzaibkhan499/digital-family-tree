import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthorizationService {
  constructor(private prisma: PrismaService) {}

  async isCommunityOwnerOrAdmin(userId: string, communityId: string): Promise<boolean> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { ownerId: true },
    });
    if (!community) return false;
    if (community.ownerId === userId) return true;

    const admin = await this.prisma.communityAdmin.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    return !!admin;
  }

  async requireCommunityOwnerOrAdmin(userId: string, communityId: string): Promise<void> {
    const allowed = await this.isCommunityOwnerOrAdmin(userId, communityId);
    if (!allowed) {
      throw new ForbiddenException('Only community owner or admin can perform this action');
    }
  }

  async isClanOwnerOrAdmin(userId: string, clanId: string): Promise<boolean> {
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
      select: { ownerId: true },
    });
    if (!clan) return false;
    if (clan.ownerId === userId) return true;

    const admin = await this.prisma.clanAdmin.findUnique({
      where: { clanId_userId: { clanId, userId } },
    });
    return !!admin;
  }

  async requireClanOwnerOrAdmin(userId: string, clanId: string): Promise<void> {
    const allowed = await this.isClanOwnerOrAdmin(userId, clanId);
    if (!allowed) {
      throw new ForbiddenException('Only clan owner or admin can perform this action');
    }
  }
}
