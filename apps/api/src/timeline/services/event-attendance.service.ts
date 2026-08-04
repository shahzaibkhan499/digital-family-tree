import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EventAttendanceService {
  constructor(private prisma: PrismaService) {}

  private async assertCanManage(eventId: string, requesterId: string, targetUserId: string) {
    if (requesterId === targetUserId) return;
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      select: { createdById: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.createdById !== requesterId) {
      throw new ForbiddenException('Only the event owner can manage attendance of other guests');
    }
  }

  async checkIn(
    eventId: string,
    requesterId: string,
    targetUserId: string,
    method: string = 'MANUAL',
    location?: any,
  ) {
    await this.assertCanManage(eventId, requesterId, targetUserId);
    return this.prisma.eventAttendance.upsert({
      where: { eventId_userId: { eventId, userId: targetUserId } },
      create: {
        eventId,
        userId: targetUserId,
        method,
        checkedInAt: new Date(),
        location: location || undefined,
      },
      update: {
        checkedInAt: new Date(),
        checkedOutAt: null,
        method,
        location: location || undefined,
      },
    });
  }

  async checkOut(eventId: string, requesterId: string, targetUserId: string) {
    await this.assertCanManage(eventId, requesterId, targetUserId);
    return this.prisma.eventAttendance.update({
      where: { eventId_userId: { eventId, userId: targetUserId } },
      data: { checkedOutAt: new Date() },
    });
  }

  async getAttendance(eventId: string) {
    return this.prisma.eventAttendance.findMany({
      where: { eventId },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { checkedInAt: 'desc' },
    });
  }

  async verifyAttendance(eventId: string, userId: string, verifiedById: string) {
    return this.prisma.eventAttendance.update({
      where: { eventId_userId: { eventId, userId } },
      data: {
        verified: true,
        verifiedById,
        verifiedAt: new Date(),
      },
    });
  }

  async getStats(eventId: string) {
    const total = await this.prisma.eventAttendance.count({ where: { eventId } });
    const checkedIn = await this.prisma.eventAttendance.count({
      where: { eventId, checkedInAt: { not: null }, checkedOutAt: null },
    });
    const checkedOut = await this.prisma.eventAttendance.count({
      where: { eventId, checkedOutAt: { not: null } },
    });
    const verified = await this.prisma.eventAttendance.count({
      where: { eventId, verified: true },
    });

    return { total, checkedIn, checkedOut, verified, currentlyPresent: checkedIn - checkedOut };
  }

  async generateQrCode(eventId: string, userId: string) {
    const code = `ATTEND:${eventId}:${userId}:${Date.now()}`;
    await this.prisma.eventAttendance.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, qrCode: code },
      update: { qrCode: code },
    });
    return { qrCode: code };
  }
}
