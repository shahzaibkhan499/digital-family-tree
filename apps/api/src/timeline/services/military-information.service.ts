import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MilitaryInformationService {
  constructor(private prisma: PrismaService) {}

  async upsert(eventId: string, data: any) {
    return this.prisma.militaryInformation.upsert({
      where: { eventId },
      create: { eventId, ...data },
      update: data,
    });
  }

  async getByEventId(eventId: string) {
    return this.prisma.militaryInformation.findUnique({ where: { eventId } });
  }

  async delete(eventId: string) {
    return this.prisma.militaryInformation.delete({ where: { eventId } });
  }

  async generateSummary(eventId: string): Promise<string> {
    const info = await this.prisma.militaryInformation.findUnique({ where: { eventId } });
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: { member: true },
    });
    if (!info || !event) return '';

    const parts: string[] = [];
    const personName = event.member ? `${event.member.firstName || 'Someone'}` : 'Someone';

    parts.push(`${personName} served`);
    if (info.branch) parts.push(`in ${info.branch}`);
    if (info.rank) parts.push(`as ${info.rank}`);

    if (info.enlistmentDate) {
      parts.push(`from ${new Date(info.enlistmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    if (info.dischargeDate) {
      parts.push(`to ${new Date(info.dischargeDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    parts.push('.');

    if (info.unit) parts.push(`Unit: ${info.unit}.`);
    if (info.base) parts.push(`Base: ${info.base}.`);
    if (info.serviceNumber) parts.push(`Service number: ${info.serviceNumber}.`);
    if (info.dischargeType) parts.push(`Discharge type: ${info.dischargeType}.`);
    if (info.isVeteran) parts.push('Veteran.');

    return parts.join(' ');
  }
}
