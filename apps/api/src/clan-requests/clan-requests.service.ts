import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { NotificationsEventService } from '../notifications/notifications-event.service';
import { ActivityEventService } from '../activities/activity-event.service';
import { CreateClanRequestDto } from './dto/create-clan-request.dto';

@Injectable()
export class ClanRequestsService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private notificationsEvent: NotificationsEventService,
    private activityEvent: ActivityEventService,
  ) {}

  async createRequest(userId: string, clanId: string, dto: CreateClanRequestDto) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const family = await this.prisma.family.findUnique({ where: { id: dto.familyId } });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.ownerId !== userId) {
      throw new ForbiddenException('You can only request to join with your own families');
    }

    if (family.clanId === clanId) {
      throw new BadRequestException('Family is already a member of this clan');
    }

    const existingPending = await this.prisma.clanRequest.findFirst({
      where: {
        clanId,
        familyId: dto.familyId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      throw new BadRequestException('You already have a pending request for this clan');
    }

    const displayId = await this.identityService.generateClanRequestId();

    const request = await this.prisma.clanRequest.create({
      data: {
        displayId,
        clanId,
        familyId: dto.familyId,
        requestedById: userId,
        message: dto.message,
        status: 'PENDING',
      },
      include: {
        clan: { select: { id: true, name: true, slug: true } },
        family: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    this.notificationsEvent.emit({
      type: 'CLAN_JOIN_REQUEST',
      title: 'Join Request',
      message: `${family.name} has requested to join clan "${clan.name}".`,
      userId: clan.ownerId,
      actionUrl: `/dashboard/clans/${clan.slug}/requests`,
      metadata: { requestId: request.id, clanId, familyId: dto.familyId, familyName: family.name },
    }).catch(() => {});

    this.activityEvent.emit({
      userId,
      eventType: 'CLAN_JOIN_REQUEST',
      title: 'Requested to join a clan',
      description: `Requested to join clan "${clan.name}" with family "${family.name}".`,
      visibility: 'PRIVATE',
      entityType: 'CLAN_REQUEST',
      entityId: request.id,
      entityName: clan.name,
    }).catch(() => {});

    return request;
  }

  async listRequests(clanId: string, status?: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const where: any = { clanId };
    if (status) {
      where.status = status;
    }

    const requests = await this.prisma.clanRequest.findMany({
      where,
      include: {
        family: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  async getUserRequests(userId: string) {
    const requests = await this.prisma.clanRequest.findMany({
      where: { requestedById: userId },
      include: {
        clan: { select: { id: true, name: true, slug: true } },
        family: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  async acceptRequest(id: string, userId: string, response?: string) {
    const request = await this.prisma.clanRequest.findUnique({
      where: { id },
      include: {
        clan: true,
        family: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been processed');
    }

    const clan = request.clan;
    if (clan.ownerId !== userId) {
      const admin = await this.prisma.clanAdmin.findUnique({
        where: { clanId_userId: { clanId: clan.id, userId } },
      });
      if (!admin) {
        throw new ForbiddenException('Only the clan owner or admin can accept requests');
      }
    }

    const [updatedRequest] = await this.prisma.$transaction([
      this.prisma.clanRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          response,
          reviewedById: userId,
          reviewedAt: new Date(),
        },
        include: {
          clan: { select: { id: true, name: true, slug: true } },
          family: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.family.update({
        where: { id: request.familyId },
        data: { clanId: clan.id },
      }),
    ]);

    this.notificationsEvent.emit({
      type: 'CLAN_JOIN_APPROVED',
      title: 'Join Request Approved',
      message: `Your request to join clan "${clan.name}" has been approved.${response ? ` Note: ${response}` : ''}`,
      userId: request.requestedById,
      actionUrl: `/dashboard/clans/${clan.slug}`,
      metadata: { requestId: id, clanId: clan.id, familyId: request.familyId },
    }).catch(() => {});

    this.activityEvent.emit({
      userId,
      eventType: 'CLAN_JOIN_APPROVED',
      title: 'Approved a join request',
      description: `Approved ${request.family.name} to join clan "${clan.name}".`,
      visibility: 'PRIVATE',
      entityType: 'CLAN_REQUEST',
      entityId: id,
      entityName: clan.name,
    }).catch(() => {});

    return updatedRequest;
  }

  async rejectRequest(id: string, userId: string, response?: string) {
    const request = await this.prisma.clanRequest.findUnique({
      where: { id },
      include: {
        clan: true,
        family: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been processed');
    }

    const clan = request.clan;
    if (clan.ownerId !== userId) {
      const admin = await this.prisma.clanAdmin.findUnique({
        where: { clanId_userId: { clanId: clan.id, userId } },
      });
      if (!admin) {
        throw new ForbiddenException('Only the clan owner or admin can reject requests');
      }
    }

    const updatedRequest = await this.prisma.clanRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        response,
        reviewedAt: new Date(),
      },
      include: {
        clan: { select: { id: true, name: true, slug: true } },
        family: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    this.notificationsEvent.emit({
      type: 'CLAN_JOIN_REJECTED',
      title: 'Join Request Rejected',
      message: `Your request to join clan "${clan.name}" has been rejected.${response ? ` Reason: ${response}` : ''}`,
      userId: request.requestedById,
      priority: 'HIGH',
      metadata: { requestId: id, clanId: clan.id, familyId: request.familyId },
    }).catch(() => {});

    this.activityEvent.emit({
      userId,
      eventType: 'CLAN_JOIN_REJECTED',
      title: 'Rejected a join request',
      description: `Rejected ${request.family.name}'s request to join clan "${clan.name}".`,
      visibility: 'PRIVATE',
      entityType: 'CLAN_REQUEST',
      entityId: id,
      entityName: clan.name,
    }).catch(() => {});

    return updatedRequest;
  }

  async cancelRequest(id: string, userId: string) {
    const request = await this.prisma.clanRequest.findUnique({
      where: { id },
      include: {
        clan: true,
        family: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.requestedById !== userId) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('You can only cancel pending requests');
    }

    await this.prisma.clanRequest.delete({ where: { id } });

    this.activityEvent.emit({
      userId,
      eventType: 'CLAN_JOIN_CANCELLED',
      title: 'Cancelled a join request',
      description: `Cancelled request to join clan "${request.clan.name}".`,
      visibility: 'PRIVATE',
      entityType: 'CLAN_REQUEST',
      entityName: request.clan.name,
    }).catch(() => {});

    return { message: 'Request cancelled successfully' };
  }

  async getStats(clanId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const [pending, approved, rejected] = await Promise.all([
      this.prisma.clanRequest.count({ where: { clanId, status: 'PENDING' } }),
      this.prisma.clanRequest.count({ where: { clanId, status: 'APPROVED' } }),
      this.prisma.clanRequest.count({ where: { clanId, status: 'REJECTED' } }),
    ]);

    return { pending, approved, rejected, total: pending + approved + rejected };
  }
}
