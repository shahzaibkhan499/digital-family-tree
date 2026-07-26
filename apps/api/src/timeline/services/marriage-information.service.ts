import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarriageInformationService {
  constructor(private prisma: PrismaService) {}

  async upsert(eventId: string, data: any) {
    return this.prisma.marriageInformation.upsert({
      where: { eventId },
      create: { eventId, ...data },
      update: data,
    });
  }

  async getByEventId(eventId: string) {
    return this.prisma.marriageInformation.findUnique({ where: { eventId } });
  }

  async delete(eventId: string) {
    return this.prisma.marriageInformation.delete({ where: { eventId } });
  }

  async generateSummary(eventId: string): Promise<string> {
    const info = await this.prisma.marriageInformation.findUnique({ where: { eventId } });
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: { member: true },
    });
    if (!info || !event) return '';

    const parts: string[] = [];
    const personName = event.member ? `${event.member.firstName || 'Someone'}` : 'Someone';
    const spouseName = info.spouseName || 'their partner';

    parts.push(`${personName} married ${spouseName}`);

    if (event.date) {
      parts.push(`on ${new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    if (event.location) parts.push(`at ${event.location}`);
    else if (info.nikahLocation) parts.push(`at ${info.nikahLocation}`);
    parts.push('.');

    if (info.ceremonyType) parts.push(`Ceremony type: ${info.ceremonyType}.`);
    if (info.marriageType) parts.push(`Marriage type: ${info.marriageType}.`);
    if (info.mahrAmount) parts.push(`Mahr: ${info.mahrAmount} ${info.mahrCurrency || ''}.`);
    if (info.dowryDetails) parts.push(`Dowry details available.`);
    if (info.totalGuests) parts.push(`Total guests: ${info.totalGuests}.`);

    return parts.join(' ');
  }
}
