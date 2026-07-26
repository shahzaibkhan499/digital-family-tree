import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmploymentInformationService {
  constructor(private prisma: PrismaService) {}

  async upsert(eventId: string, data: any) {
    return this.prisma.employmentInformation.upsert({
      where: { eventId },
      create: { eventId, ...data },
      update: data,
    });
  }

  async getByEventId(eventId: string) {
    return this.prisma.employmentInformation.findUnique({ where: { eventId } });
  }

  async delete(eventId: string) {
    return this.prisma.employmentInformation.delete({ where: { eventId } });
  }

  async generateSummary(eventId: string): Promise<string> {
    const info = await this.prisma.employmentInformation.findUnique({ where: { eventId } });
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: { member: true },
    });
    if (!info || !event) return '';

    const parts: string[] = [];
    const personName = event.member ? `${event.member.firstName || 'Someone'}` : 'Someone';

    const eventType = event.eventType;
    if (eventType === 'PROMOTION') {
      parts.push(`${personName} was promoted to ${info.jobTitle || info.position || 'a new role'}`);
    } else if (eventType === 'RETIREMENT') {
      parts.push(`${personName} retired from ${info.companyName || 'their position'}`);
    } else {
      parts.push(`${personName} started as ${info.jobTitle || info.position || 'an employee'}`);
    }

    if (info.companyName) parts.push(`at ${info.companyName}`);

    if (event.date) {
      parts.push(`on ${new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    if (info.workLocation) parts.push(`in ${info.workLocation}`);
    else if (event.location) parts.push(`in ${event.location}`);
    parts.push('.');

    if (info.employmentType) parts.push(`Employment type: ${info.employmentType}.`);
    if (info.isRemote) parts.push('Remote work: Yes.');
    if (info.isCurrent) parts.push('Current position.');

    return parts.join(' ');
  }
}
