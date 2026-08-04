import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { CreateEventInvitationDto } from './dto/create-event-invitation.dto';

@Injectable()
export class EventInvitationsService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
  ) {}

  async createInvitations(userId: string, dto: CreateEventInvitationDto) {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: dto.eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const scope = dto.scope || 'INDIVIDUAL';
    let userIdsToInvite: string[] = [];

    if (scope === 'INDIVIDUAL' && dto.userIds?.length) {
      userIdsToInvite = dto.userIds;
    } else if ((scope === 'FAMILY' || scope === 'MULTIPLE_FAMILIES') && dto.familyIds?.length) {
      const families = await this.prisma.family.findMany({
        where: { id: { in: dto.familyIds } },
        select: { ownerId: true },
      });
      userIdsToInvite = families.map((f) => f.ownerId);
      const familyMembers = await this.prisma.familyMember.findMany({
        where: { familyId: { in: dto.familyIds } },
        select: { email: true },
      });
      const memberEmails = [
        ...new Set(familyMembers.map((m) => m.email).filter(Boolean) as string[]),
      ];
      if (memberEmails.length > 0) {
        const memberUsers = await this.prisma.user.findMany({
          where: { email: { in: memberEmails } },
          select: { id: true },
        });
        userIdsToInvite.push(...memberUsers.map((u) => u.id));
      }
    } else if (scope === 'SUB_CLAN' && dto.subClanId) {
      const families = await this.prisma.family.findMany({
        where: { subClanId: dto.subClanId },
        select: { ownerId: true },
      });
      userIdsToInvite = families.map((f) => f.ownerId);
    } else if (scope === 'CLAN' && dto.clanId) {
      const families = await this.prisma.family.findMany({
        where: { clanId: dto.clanId },
        select: { ownerId: true },
      });
      userIdsToInvite = families.map((f) => f.ownerId);
    } else if (scope === 'COMMUNITY' && dto.communityId) {
      const clans = await this.prisma.clan.findMany({
        where: { communityId: dto.communityId },
        select: { id: true },
      });
      const clanIds = clans.map((c) => c.id);
      const families = await this.prisma.family.findMany({
        where: { clanId: { in: clanIds } },
        select: { ownerId: true },
      });
      userIdsToInvite = families.map((f) => f.ownerId);
    }

    userIdsToInvite = [...new Set(userIdsToInvite)].filter((id) => id !== userId);

    if (userIdsToInvite.length === 0) {
      return { invitations: [], total: 0, scope };
    }

    const existingInvites = await this.prisma.eventInvitation.findMany({
      where: { eventId: dto.eventId, userId: { in: userIdsToInvite } },
      select: { userId: true },
    });
    const existingUserIds = new Set(existingInvites.map((i) => i.userId));
    const newUserIds = userIdsToInvite.filter((id) => !existingUserIds.has(id));

    let invitations: any[] = [];
    if (newUserIds.length > 0) {
      const displayIds = await Promise.all(
        newUserIds.map(() => this.identityService.generateEventInvitationId()),
      );
      const data = newUserIds.map((uid, i) => ({
        displayId: displayIds[i],
        eventId: dto.eventId,
        userId: uid,
        invitedById: userId,
        scope,
        message: dto.message || null,
      }));

      await this.prisma.$transaction((tx) =>
        tx.eventInvitation.createMany({ data, skipDuplicates: true }),
      );

      invitations = await this.prisma.eventInvitation.findMany({
        where: { eventId: dto.eventId, userId: { in: newUserIds } },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          invitedBy: { select: { id: true, name: true, avatar: true } },
        },
      });
    }

    return { invitations, total: invitations.length, scope };
  }

  async getEventInvitations(eventId: string) {
    const invitations = await this.prisma.eventInvitation.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, avatar: true, displayId: true } },
        invitedBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations;
  }

  async respondToInvitation(userId: string, invitationId: string, status: string) {
    const invitation = await this.prisma.eventInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.userId !== userId)
      throw new ForbiddenException('You can only respond to your own invitations');

    return this.prisma.eventInvitation.update({
      where: { id: invitationId },
      data: { status },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        invitedBy: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async getMyInvitations(userId: string) {
    const invitations = await this.prisma.eventInvitation.findMany({
      where: { userId, status: 'PENDING' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventType: true,
            date: true,
            time: true,
            location: true,
            venue: true,
            coverImage: true,
            family: { select: { id: true, name: true } },
          },
        },
        invitedBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations;
  }

  async getInvitationStats(eventId: string) {
    const grouped = await this.prisma.eventInvitation.groupBy({
      by: ['status'],
      where: { eventId },
      _count: { status: true },
    });

    const counts: Record<string, number> = { ACCEPTED: 0, DECLINED: 0, MAYBE: 0, PENDING: 0 };
    for (const g of grouped) {
      counts[g.status] = g._count.status;
    }

    return {
      total: grouped.reduce((sum, g) => sum + g._count.status, 0),
      accepted: counts.ACCEPTED,
      declined: counts.DECLINED,
      maybe: counts.MAYBE,
      pending: counts.PENDING,
    };
  }
}
