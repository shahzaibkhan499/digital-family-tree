import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeathInformationService {
  constructor(private prisma: PrismaService) {}

  async upsert(eventId: string, data: any) {
    return this.prisma.deathInformation.upsert({
      where: { eventId },
      create: { eventId, ...data },
      update: data,
    });
  }

  async getByEventId(eventId: string) {
    return this.prisma.deathInformation.findUnique({ where: { eventId } });
  }

  async delete(eventId: string) {
    return this.prisma.deathInformation.delete({ where: { eventId } });
  }

  async generateSummary(eventId: string): Promise<string> {
    const info = await this.prisma.deathInformation.findUnique({ where: { eventId } });
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: { member: true },
    });
    if (!info || !event) return '';

    const parts: string[] = [];
    const personName = event.member ? `${event.member.firstName || 'Someone'}` : 'Someone';

    parts.push(`${personName} passed away`);

    if (event.date) {
      parts.push(`on ${new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    if (info.ageAtDeath) parts.push(`at the age of ${info.ageAtDeath}`);
    if (event.location) parts.push(`in ${event.location}`);
    else if (info.deathPlace) parts.push(`in ${info.deathPlace}`);
    parts.push('.');

    if (info.causeOfDeath) parts.push(`Cause: ${info.causeOfDeath}.`);
    if (info.deathType) parts.push(`Death type: ${info.deathType}.`);
    if (info.burialDate) parts.push(`Burial date: ${new Date(info.burialDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`);
    if (info.burialLocation) parts.push(`Burial location: ${info.burialLocation}.`);
    if (info.organDonation) parts.push('Organ donation: Yes.');
    if (info.memorialService) parts.push('Memorial service held.');

    return parts.join(' ');
  }
}
