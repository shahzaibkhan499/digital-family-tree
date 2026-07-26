import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BusinessInformationService {
  constructor(private prisma: PrismaService) {}

  async upsert(eventId: string, data: any) {
    return this.prisma.businessInformation.upsert({
      where: { eventId },
      create: { eventId, ...data },
      update: data,
    });
  }

  async getByEventId(eventId: string) {
    return this.prisma.businessInformation.findUnique({ where: { eventId } });
  }

  async delete(eventId: string) {
    return this.prisma.businessInformation.delete({ where: { eventId } });
  }

  async generateSummary(eventId: string): Promise<string> {
    const info = await this.prisma.businessInformation.findUnique({ where: { eventId } });
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: { member: true },
    });
    if (!info || !event) return '';

    const parts: string[] = [];
    const personName = event.member ? `${event.member.firstName || 'Someone'}` : 'Someone';

    parts.push(`${personName} founded ${info.businessName || 'a business'}`);

    if (info.businessType) parts.push(`(${info.businessType})`);

    if (event.date) {
      parts.push(`on ${new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    else if (info.registrationDate) {
      parts.push(`on ${new Date(info.registrationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }

    if (event.location) parts.push(`in ${event.location}`);
    else if (info.city || info.country) {
      const loc = [info.city, info.country].filter(Boolean).join(', ');
      parts.push(`in ${loc}`);
    }
    parts.push('.');

    if (info.industry) parts.push(`Industry: ${info.industry}.`);
    if (info.legalStructure) parts.push(`Legal structure: ${info.legalStructure}.`);
    if (info.initialInvestment) parts.push(`Initial investment: ${info.initialInvestment} ${info.investmentCurrency || ''}.`);
    if (info.employees) parts.push(`Employees: ${info.employees}.`);

    return parts.join(' ');
  }
}
