import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ClanRole = 'OWNER' | 'ADMIN' | 'FAMILY_ADMIN' | 'FAMILY_MEMBER' | 'GUEST';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async getClanRole(userId: string, clanId: string): Promise<ClanRole> {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) return 'GUEST';
    if (clan.ownerId === userId) return 'OWNER';

    const admin = await this.prisma.clanAdmin.findUnique({
      where: { clanId_userId: { clanId, userId } },
    });
    if (admin) return admin.role as ClanRole;

    const isFamilyMember = await this.prisma.family.findFirst({
      where: {
        clanId,
        OR: [
          { ownerId: userId },
          { members: { some: { email: undefined } } },
        ],
      },
    });
    if (isFamilyMember) {
      if (isFamilyMember.ownerId === userId) return 'FAMILY_ADMIN';
      return 'FAMILY_MEMBER';
    }

    return 'GUEST';
  }

  canManageClan(role: ClanRole): boolean {
    return role === 'OWNER' || role === 'ADMIN';
  }

  canApproveRequests(role: ClanRole): boolean {
    return role === 'OWNER' || role === 'ADMIN';
  }

  canManageMembers(role: ClanRole): boolean {
    return role === 'OWNER' || role === 'ADMIN';
  }

  canEditHistory(role: ClanRole): boolean {
    return ['OWNER', 'ADMIN', 'FAMILY_ADMIN'].includes(role);
  }

  canViewDashboard(role: ClanRole): boolean {
    return role !== 'GUEST';
  }

  canModerateHistory(role: ClanRole): boolean {
    return role === 'OWNER' || role === 'ADMIN';
  }

  async canViewTimelineEvent(userId: string, event: any): Promise<boolean> {
    if (event.visibility === 'PUBLIC') return true;
    if (event.visibility === 'ONLY_ME') return event.createdById === userId;

    const userFamilies = await this.prisma.family.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: {} } }] },
      select: { id: true, subClanId: true, clanId: true },
    });
    const familyIds = userFamilies.map(f => f.id);

    if (event.visibility === 'FAMILY') return familyIds.includes(event.familyId);

    if (event.visibility === 'SUB_CLAN') {
      const subClanFamilies = userFamilies.filter(f => f.subClanId && f.subClanId === event.subClanId);
      return subClanFamilies.length > 0;
    }

    if (event.visibility === 'CLAN') {
      const clanFamilies = userFamilies.filter(f => f.clanId && f.clanId === event.clanId);
      return clanFamilies.length > 0;
    }

    if (event.visibility === 'COMMUNITY') {
      const clanIds = userFamilies.map(f => f.clanId).filter(Boolean) as string[];
      if (clanIds.length === 0) return false;
      const matchingClan = await this.prisma.clan.findFirst({
        where: { id: { in: clanIds }, communityId: event.communityId },
      });
      return !!matchingClan;
    }

    return false;
  }

  async canViewMemory(userId: string, memory: any): Promise<boolean> {
    if (memory.visibility === 'PUBLIC') return true;
    if (memory.visibility === 'ONLY_ME') return memory.userId === userId;

    const userFamilies = await this.prisma.family.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: {} } }] },
      select: { id: true, subClanId: true, clanId: true },
    });
    const familyIds = userFamilies.map(f => f.id);

    if (memory.visibility === 'FAMILY') return familyIds.includes(memory.familyId);

    if (memory.visibility === 'SUB_CLAN') {
      return userFamilies.some(f => f.subClanId && f.subClanId === memory.subClanId);
    }

    if (memory.visibility === 'CLAN') {
      return userFamilies.some(f => f.clanId && f.clanId === memory.clanId);
    }

    if (memory.visibility === 'COMMUNITY') {
      const clanIds = userFamilies.map(f => f.clanId).filter(Boolean) as string[];
      if (clanIds.length === 0) return false;
      const matchingClan = await this.prisma.clan.findFirst({
        where: { id: { in: clanIds }, communityId: memory.communityId },
      });
      return !!matchingClan;
    }

    return false;
  }

  async getVisibleFamilyIds(userId: string): Promise<string[]> {
    const families = await this.prisma.family.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: {} } }] },
      select: { id: true },
    });
    return families.map(f => f.id);
  }

  async getVisibleSubClanIds(userId: string): Promise<string[]> {
    const families = await this.prisma.family.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: {} } }] },
      select: { subClanId: true },
    });
    return [...new Set(families.map(f => f.subClanId).filter(Boolean))] as string[];
  }

  async getVisibleClanIds(userId: string): Promise<string[]> {
    const families = await this.prisma.family.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: {} } }] },
      select: { clanId: true },
    });
    return [...new Set(families.map(f => f.clanId).filter(Boolean))] as string[];
  }

  async getVisibleCommunityIds(userId: string): Promise<string[]> {
    const families = await this.prisma.family.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: {} } }] },
      select: { clanId: true },
    });
    const clanIds = [...new Set(families.map(f => f.clanId).filter(Boolean))] as string[];
    if (clanIds.length === 0) return [];
    const clans = await this.prisma.clan.findMany({
      where: { id: { in: clanIds } },
      select: { communityId: true },
    });
    return [...new Set(clans.map(c => c.communityId).filter(Boolean))] as string[];
  }
}
