import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EventAttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(eventId: string, userId: string, method: string = 'MANUAL', location?: any) {
    return this.prisma.eventAttendance.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: {
        eventId,
        userId,
        method,
        checkedInAt: new Date(),
        location: location || undefined,
      },
      update: {
        checkedInAt: new Date(),
        method,
        location: location || undefined,
      },
    });
  }

  async checkOut(eventId: string, userId: string) {
    return this.prisma.eventAttendance.update({
      where: { eventId_userId: { eventId, userId } },
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
