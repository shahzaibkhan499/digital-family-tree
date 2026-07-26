import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BirthInformationService {
  constructor(private prisma: PrismaService) {}

  async upsert(eventId: string, data: any) {
    return this.prisma.birthInformation.upsert({
      where: { eventId },
      create: { eventId, ...data },
      update: data,
    });
  }

  async getByEventId(eventId: string) {
    return this.prisma.birthInformation.findUnique({ where: { eventId } });
  }

  async delete(eventId: string) {
    return this.prisma.birthInformation.delete({ where: { eventId } });
  }

  async generateSummary(eventId: string): Promise<string> {
    const info = await this.prisma.birthInformation.findUnique({ where: { eventId } });
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: { member: true },
    });
    if (!info || !event) return '';

    const parts: string[] = [];
    if (event.date) {
      parts.push(`On ${new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })},`);
    }
    if (event.member) {
      parts.push(`${event.member.firstName || 'Someone'} was born`);
    }
    if (event.location) parts.push(`in ${event.location}`);
    if (info.hospitalName) parts.push(`at ${info.hospitalName}`);
    parts.push('.');
    if (info.birthWeight) parts.push(`Birth weight: ${info.birthWeight}${info.birthWeightUnit}.`);
    if (info.fatherName) parts.push(`Father: ${info.fatherName}.`);
    if (info.motherName) parts.push(`Mother: ${info.motherName}.`);
    if (info.bloodGroup) parts.push(`Blood Group: ${info.bloodGroup}.`);
    if (info.vaccinationStarted) parts.push('Vaccination started.');

    return parts.join(' ');
  }
}
