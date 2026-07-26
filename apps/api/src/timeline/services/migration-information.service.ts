import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MigrationInformationService {
  constructor(private prisma: PrismaService) {}

  async upsert(eventId: string, data: any) {
    return this.prisma.migrationInformation.upsert({
      where: { eventId },
      create: { eventId, ...data },
      update: data,
    });
  }

  async getByEventId(eventId: string) {
    return this.prisma.migrationInformation.findUnique({ where: { eventId } });
  }

  async delete(eventId: string) {
    return this.prisma.migrationInformation.delete({ where: { eventId } });
  }

  async generateSummary(eventId: string): Promise<string> {
    const info = await this.prisma.migrationInformation.findUnique({ where: { eventId } });
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: { member: true },
    });
    if (!info || !event) return '';

    const parts: string[] = [];
    const personName = event.member ? `${event.member.firstName || 'Someone'}` : 'Someone';

    const origin = [info.originCity, info.originCountry].filter(Boolean).join(', ');
    const destination = [info.destinationCity, info.destinationCountry].filter(Boolean).join(', ');

    parts.push(`${personName} migrated`);
    if (origin) parts.push(`from ${origin}`);
    if (destination) parts.push(`to ${destination}`);

    if (event.date) {
      parts.push(`on ${new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    parts.push('.');

    if (info.migrationType) parts.push(`Migration type: ${info.migrationType}.`);
    if (info.reasonForMigration) parts.push(`Reason: ${info.reasonForMigration}.`);
    if (info.visaType) parts.push(`Visa type: ${info.visaType}.`);
    if (info.travelMethod) parts.push(`Travel method: ${info.travelMethod}.`);

    return parts.join(' ');
  }
}
