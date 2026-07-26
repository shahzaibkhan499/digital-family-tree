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
    } else if (scope === 'FAMILY' && dto.familyIds?.length) {
      for (const familyId of dto.familyIds) {
        const family = await this.prisma.family.findUnique({
          where: { id: familyId },
          select: { ownerId: true, members: { select: { email: true } } },
        });
        if (family) {
          userIdsToInvite.push(family.ownerId);
        }
      }
      const familyMembers = await this.prisma.familyMember.findMany({
        where: { familyId: { in: dto.familyIds } },
        select: { email: true },
      });
      const memberEmails = familyMembers.map(m => m.email).filter(Boolean) as string[];
      if (memberEmails.length > 0) {
        const memberUsers = await this.prisma.user.findMany({
          where: { email: { in: memberEmails } },
          select: { id: true },
        });
        userIdsToInvite.push(...memberUsers.map(u => u.id));
      }
    } else if (scope === 'MULTIPLE_FAMILIES' && dto.familyIds?.length) {
      for (const familyId of dto.familyIds) {
        const family = await this.prisma.family.findUnique({
          where: { id: familyId },
          select: { ownerId: true },
        });
        if (family) {
          userIdsToInvite.push(family.ownerId);
        }
      }
      const familyMembers = await this.prisma.familyMember.findMany({
        where: { familyId: { in: dto.familyIds } },
        select: { email: true },
      });
      const memberEmails = familyMembers.map(m => m.email).filter(Boolean) as string[];
      if (memberEmails.length > 0) {
        const memberUsers = await this.prisma.user.findMany({
          where: { email: { in: memberEmails } },
          select: { id: true },
        });
        userIdsToInvite.push(...memberUsers.map(u => u.id));
      }
    } else if (scope === 'SUB_CLAN' && dto.subClanId) {
      const families = await this.prisma.family.findMany({
        where: { subClanId: dto.subClanId },
        select: { ownerId: true },
      });
      userIdsToInvite = families.map(f => f.ownerId);
    } else if (scope === 'CLAN' && dto.clanId) {
      const families = await this.prisma.family.findMany({
        where: { clanId: dto.clanId },
        select: { ownerId: true },
      });
      userIdsToInvite = families.map(f => f.ownerId);
    } else if (scope === 'COMMUNITY' && dto.communityId) {
      const clans = await this.prisma.clan.findMany({
        where: { communityId: dto.communityId },
        select: { id: true },
      });
      const clanIds = clans.map(c => c.id);
      const families = await this.prisma.family.findMany({
        where: { clanId: { in: clanIds } },
        select: { ownerId: true },
      });
      userIdsToInvite = families.map(f => f.ownerId);
    }

    userIdsToInvite = [...new Set(userIdsToInvite)].filter(id => id !== userId);

    const displayIds = await Promise.all(
      userIdsToInvite.map(() => this.identityService.generateEventInvitationId()),
    );

    const invitations = [];
    for (let i = 0; i < userIdsToInvite.length; i++) {
      const existing = await this.prisma.eventInvitation.findUnique({
        where: { eventId_userId: { eventId: dto.eventId, userId: userIdsToInvite[i] } },
      });
      if (!existing) {
        const invitation = await this.prisma.eventInvitation.create({
          data: {
            displayId: displayIds[i],
            eventId: dto.eventId,
            userId: userIdsToInvite[i],
            invitedById: userId,
            scope,
            message: dto.message || null,
          },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            invitedBy: { select: { id: true, name: true, avatar: true } },
          },
        });
        invitations.push(invitation);
      }
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
    if (invitation.userId !== userId) throw new ForbiddenException('You can only respond to your own invitations');

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
    const invitations = await this.prisma.eventInvitation.findMany({
      where: { eventId },
      select: { status: true },
    });

    const stats = {
      total: invitations.length,
      accepted: invitations.filter(i => i.status === 'ACCEPTED').length,
      declined: invitations.filter(i => i.status === 'DECLINED').length,
      maybe: invitations.filter(i => i.status === 'MAYBE').length,
      pending: invitations.filter(i => i.status === 'PENDING').length,
    };

    return stats;
  }
}
