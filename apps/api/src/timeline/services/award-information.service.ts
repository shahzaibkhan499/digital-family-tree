import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AwardInformationService {
  constructor(private prisma: PrismaService) {}

  async upsert(eventId: string, data: any) {
    return this.prisma.awardInformation.upsert({
      where: { eventId },
      create: { eventId, ...data },
      update: data,
    });
  }

  async getByEventId(eventId: string) {
    return this.prisma.awardInformation.findUnique({ where: { eventId } });
  }

  async delete(eventId: string) {
    return this.prisma.awardInformation.delete({ where: { eventId } });
  }

  async generateSummary(eventId: string): Promise<string> {
    const info = await this.prisma.awardInformation.findUnique({ where: { eventId } });
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: { member: true },
    });
    if (!info || !event) return '';

    const parts: string[] = [];
    const personName = event.member ? `${event.member.firstName || 'Someone'}` : 'Someone';

    parts.push(`${personName} received the ${info.awardName || 'award'}`);

    if (info.organization) parts.push(`from ${info.organization}`);
    if (info.presentedBy) parts.push(`presented by ${info.presentedBy}`);

    if (event.date) {
      parts.push(`on ${new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    else if (info.ceremonyDate) {
      parts.push(`on ${new Date(info.ceremonyDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    parts.push('.');

    if (info.awardType) parts.push(`Award type: ${info.awardType}.`);
    if (info.level) parts.push(`Level: ${info.level}.`);
    if (info.prizeAmount) parts.push(`Prize: ${info.prizeAmount} ${info.prizeCurrency || ''}.`);
    if (info.isLifetime) parts.push('Lifetime award.');
    if (info.isPosthumous) parts.push('Posthumous award.');

    return parts.join(' ');
  }
}
