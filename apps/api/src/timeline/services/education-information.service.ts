import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EducationInformationService {
  constructor(private prisma: PrismaService) {}

  async upsert(eventId: string, data: any) {
    return this.prisma.educationInformation.upsert({
      where: { eventId },
      create: { eventId, ...data },
      update: data,
    });
  }

  async getByEventId(eventId: string) {
    return this.prisma.educationInformation.findUnique({ where: { eventId } });
  }

  async delete(eventId: string) {
    return this.prisma.educationInformation.delete({ where: { eventId } });
  }

  async generateSummary(eventId: string): Promise<string> {
    const info = await this.prisma.educationInformation.findUnique({ where: { eventId } });
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: { member: true },
    });
    if (!info || !event) return '';

    const parts: string[] = [];
    const personName = event.member ? `${event.member.firstName || 'Someone'}` : 'Someone';

    const eventType = event.eventType;
    if (eventType === 'GRADUATION') {
      parts.push(`${personName} graduated`);
    } else {
      parts.push(`${personName} enrolled`);
    }

    if (info.institutionName) parts.push(`at ${info.institutionName}`);
    if (info.fieldOfStudy) parts.push(`studying ${info.fieldOfStudy}`);
    else if (info.degree) parts.push(`for ${info.degree}`);

    if (event.date) {
      parts.push(`on ${new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    parts.push('.');

    if (info.gpa) parts.push(`GPA: ${info.gpa}${info.gpaScale ? `/${info.gpaScale}` : ''}.`);
    if (info.honors) parts.push(`Honors: ${info.honors}.`);
    if (info.wasScholarship) parts.push(`Scholarship: ${info.scholarshipDetails || 'Yes'}.`);
    if (info.thesis) parts.push(`Thesis: ${info.thesis}.`);

    return parts.join(' ');
  }
}
