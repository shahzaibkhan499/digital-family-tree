import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsEventService } from '../notifications/notifications-event.service';
import { ActivityEventService } from '../activities/activity-event.service';
import { TimelineService } from '../timeline/timeline.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsEvent: NotificationsEventService,
    private activityEvent: ActivityEventService,
    private timelineService: TimelineService,
  ) {}

  async create(userId: string, dto: CreateInvitationDto) {
    const family = await this.prisma.family.findUnique({
      where: { id: dto.familyId },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.ownerId !== userId) {
      throw new ForbiddenException('Only the family owner can send invitations');
    }

    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        familyId: dto.familyId,
        email: dto.email.toLowerCase().trim(),
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      throw new BadRequestException('An invitation has already been sent to this email for this family');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase().trim(),
        accountStatus: 'active',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        displayId: true,
        username: true,
        profileSlug: true,
      },
    });

    const token = randomBytes(32).toString('hex');

    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        familyId: dto.familyId,
        email: dto.email.toLowerCase().trim(),
        role: dto.role || 'MEMBER',
        invitedById: userId,
        token,
        expiresAt,
      },
      include: {
        family: { select: { id: true, name: true, displayId: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (existingUser) {
      this.notificationsEvent.emit({
        type: 'FAMILY_INVITATION',
        title: 'Family Invitation',
        message: `You have been invited to join "${invitation.family.name}" by ${invitation.invitedBy.name}.`,
        userId: existingUser.id,
        actionUrl: '/dashboard/families',
        priority: 'HIGH',
        metadata: { familyId: dto.familyId, familyName: invitation.family.name, invitationId: invitation.id },
      }).catch(() => {});
    }

    this.activityEvent.emitInvitationSent(userId, dto.familyId, invitation.family.name, dto.email).catch(() => {});

    return {
      ...invitation,
      recipientIsExistingUser: !!existingUser,
      recipientUser: existingUser || null,
    };
  }

  async listPending(userId: string) {
    const families = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const familyIds = families.map((f) => f.id);

    return this.prisma.invitation.findMany({
      where: {
        familyId: { in: familyIds },
        status: 'PENDING',
      },
      include: {
        family: { select: { id: true, name: true, displayId: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAll(userId: string) {
    const families = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const familyIds = families.map((f) => f.id);

    return this.prisma.invitation.findMany({
      where: {
        familyId: { in: familyIds },
      },
      include: {
        family: { select: { id: true, name: true, displayId: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listReceived(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.invitation.findMany({
      where: {
        email: user.email.toLowerCase().trim(),
        status: 'PENDING',
      },
      include: {
        family: { select: { id: true, name: true, displayId: true } },
        invitedBy: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async accept(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation is no longer pending');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation has expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.email.toLowerCase().trim() !== invitation.email.toLowerCase().trim()) {
      throw new ForbiddenException('This invitation is not for you');
    }

    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'ACCEPTED' },
      include: {
        family: { select: { id: true, name: true, displayId: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });

    this.notificationsEvent.emit({
      type: 'INVITATION_ACCEPTED',
      title: 'Invitation Accepted',
      message: `${user.name} has accepted your invitation to "${updated.family.name}".`,
      userId: invitation.invitedById,
      actionUrl: `/dashboard/families/${updated.family.id}`,
      metadata: { familyId: updated.family.id, familyName: updated.family.name },
    }).catch(() => {});

    this.activityEvent.emitInvitationAccepted(invitation.invitedById, updated.family.id, updated.family.name, user.name).catch(() => {});

    this.timelineService.create({
      familyId: updated.family.id,
      eventType: 'FAMILY_REUNION',
      title: `${user.name} joined the family`,
      description: `${user.name} accepted the invitation to "${updated.family.name}".`,
      isAuto: true,
    }).catch(() => {});

    return updated;
  }

  async decline(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation is no longer pending');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.email.toLowerCase().trim() !== invitation.email.toLowerCase().trim()) {
      throw new ForbiddenException('This invitation is not for you');
    }

    const updatedDeclined = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'DECLINED' },
      include: {
        family: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });

    this.notificationsEvent.emit({
      type: 'INVITATION_DECLINED',
      title: 'Invitation Declined',
      message: `${user.name || 'Someone'} has declined your invitation to "${updatedDeclined.family.name}".`,
      userId: invitation.invitedById,
      metadata: { familyId: updatedDeclined.family.id, familyName: updatedDeclined.family.name },
    }).catch(() => {});

    this.activityEvent.emitInvitationDeclined(invitation.invitedById, updatedDeclined.family.id, updatedDeclined.family.name, user.name || 'Someone').catch(() => {});

    return updatedDeclined;
  }

  async remove(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { family: { select: { ownerId: true } } },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.family.ownerId !== userId) {
      throw new ForbiddenException('You can only delete invitations for your own families');
    }

    await this.prisma.invitation.delete({ where: { id: invitationId } });

    return { message: 'Invitation deleted successfully' };
  }

  async checkExistingUser(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        accountStatus: 'active',
        deletedAt: null,
      },
      select: {
        id: true,
        displayId: true,
        name: true,
        email: true,
        avatar: true,
        username: true,
        profileSlug: true,
        city: true,
        country: true,
        occupation: true,
      },
    });

    return {
      exists: !!user,
      user: user || null,
    };
  }
}
