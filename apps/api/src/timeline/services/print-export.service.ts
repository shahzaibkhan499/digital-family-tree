import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrintExportService {
  constructor(private prisma: PrismaService) {}

  async generatePrintVersion(eventId: string, options: {
    versionType?: string;
    includeMap?: boolean;
    includeTimeline?: boolean;
    includePhotos?: boolean;
    includeDocuments?: boolean;
    includeGuests?: boolean;
    colorScheme?: string;
    fontFamily?: string;
    layout?: string;
  } = {}) {
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: {
        member: true,
        family: true,
        media: true,
        documents: true,
        participants: { include: { user: true } },
        summary: true,
      },
    });
    if (!event) throw new Error('Event not found');

    const html = this.generateHTML(event, options);

    return this.prisma.eventPrintVersion.upsert({
      where: { eventId },
      create: {
        eventId,
        htmlContent: html,
        versionType: options.versionType || 'STANDARD',
        includeMap: options.includeMap ?? true,
        includeTimeline: options.includeTimeline ?? true,
        includePhotos: options.includePhotos ?? true,
        includeDocuments: options.includeDocuments ?? false,
        includeGuests: options.includeGuests ?? false,
        colorScheme: options.colorScheme || 'default',
        fontFamily: options.fontFamily || 'serif',
        layout: options.layout || 'portrait',
      },
      update: {
        htmlContent: html,
        versionType: options.versionType || 'STANDARD',
      },
    });
  }

  async getPrintVersion(eventId: string) {
    return this.prisma.eventPrintVersion.findUnique({ where: { eventId } });
  }

  async exportAsJSON(eventId: string) {
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: {
        member: true,
        family: true,
        media: true,
        documents: true,
        participants: { include: { user: true } },
        summary: true,
        comments: { include: { user: true } },
        birthInfo: true,
        marriageInfo: true,
        deathInfo: true,
        educationInfo: true,
        employmentInfo: true,
        migrationInfo: true,
        militaryInfo: true,
        awardInfo: true,
        businessInfo: true,
      },
    });
    return event;
  }

  async exportPdf(eventId: string) {
    const printVersion = await this.generatePrintVersion(eventId);
    return { url: `/api/timeline/events/${eventId}/print`, id: printVersion.id };
  }

  async exportCsv(eventId: string) {
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: { family: true, member: true, participants: { include: { user: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');

    const rows = [
      ['Field', 'Value'].join(','),
      ['Title', `"${(event.title || '').replace(/"/g, '""')}"`].join(','),
      ['Type', event.eventType].join(','),
      ['Date', event.date ? new Date(event.date).toISOString().split('T')[0] : ''].join(','),
      ['Status', event.status || ''].join(','),
      ['Location', `"${(event.location || '').replace(/"/g, '""')}"`].join(','),
      ['Description', `"${(event.description || '').replace(/"/g, '""')}"`].join(','),
      ['Family', `"${(event.family?.name || '').replace(/"/g, '""')}"`].join(','),
      ['Participant', `"${(event.member ? `${event.member.firstName || ''} ${event.member.lastName || ''}` : '').replace(/"/g, '""')}"`].join(','),
      ['Visibility', event.visibility || ''].join(','),
      ['Created', event.createdAt ? new Date(event.createdAt).toISOString() : ''].join(','),
    ];

    return rows.join('\n');
  }

  private generateHTML(event: any, options: any): string {
    const familyName = event.family?.name || 'Family';
    const memberName = event.member ? `${event.member.firstName || ''} ${event.member.lastName || ''}`.trim() : '';

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${event.title}</title>
    <style>body{font-family:${options.fontFamily || 'serif'};max-width:800px;margin:0 auto;padding:40px}
    h1{color:#333}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ddd;text-align:left}
    .badge{display:inline-block;padding:2px 8px;border-radius:4px;background:#e5e7eb;font-size:12px}
    img{max-width:100%}</style></head><body>
    <h1>${event.title}</h1>
    <p class="badge">${event.eventType}</p> <p class="badge">${event.status}</p>
    ${event.subtitle ? `<h2>${event.subtitle}</h2>` : ''}
    ${event.date ? `<p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>` : ''}
    ${memberName ? `<p><strong>Person:</strong> ${memberName}</p>` : ''}
    ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
    ${event.description ? `<p>${event.description}</p>` : ''}
    ${event.summary?.generatedText ? `<h3>Summary</h3><p>${event.summary.editedText || event.summary.generatedText}</p>` : ''}
    ${options.includePhotos && event.media?.length ? `<h3>Photos</h3>${event.media.map((m: any) => `<img src="${m.url}" alt="${m.caption || ''}">`).join('')}` : ''}
    ${options.includeDocuments && event.documents?.length ? `<h3>Documents</h3><table><tr><th>Name</th><th>Type</th><th>Status</th></tr>${event.documents.map((d: any) => `<tr><td>${d.title || d.fileName}</td><td>${d.fileType}</td><td>${d.verificationStatus}</td></tr>`).join('')}</table>` : ''}
    ${options.includeGuests && event.participants?.length ? `<h3>Guests</h3><table><tr><th>Name</th><th>RSVP</th></tr>${event.participants.map((p: any) => `<tr><td>${p.user?.name || 'Unknown'}</td><td>${p.rsvpStatus}</td></tr>`).join('')}</table>` : ''}
    <hr><p style="color:#999;font-size:12px">Generated by Digital Family Tree Platform</p>
    </body></html>`;
  }
}
