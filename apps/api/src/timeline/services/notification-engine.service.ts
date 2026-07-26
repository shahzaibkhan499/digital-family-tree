import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationEngineService {
  constructor(private prisma: PrismaService) {}

  async onEventCreated(eventId: string) {
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: { family: true, createdBy: true, member: true },
    });
    if (!event) return;

    const memberName = event.member ? `${(event.member as any).firstName || ''} ${(event.member as any).lastName || ''}`.trim() : '';
    const notification = this.generateNotification(event.eventType, event.title, memberName, event.date);

    await this.prisma.eventActivity.create({
      data: {
        eventId,
        userId: event.createdById || '',
        action: 'EVENT_CREATED',
        description: notification,
        metadata: JSON.stringify({ eventType: event.eventType, title: event.title }),
      },
    });
  }

  async onEventPublished(eventId: string) {
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: { family: true, member: true },
    });
    if (!event) return;

    const memberName = event.member ? `${(event.member as any).firstName || ''} ${(event.member as any).lastName || ''}`.trim() : '';
    const notification = this.generateNotification(event.eventType, event.title, memberName, event.date);

    await this.prisma.eventActivity.create({
      data: {
        eventId,
        userId: event.createdById || '',
        action: 'EVENT_PUBLISHED',
        description: `Published: ${notification}`,
      },
    });
  }

  async onEventCommented(eventId: string, userId: string, content: string) {
    await this.prisma.eventActivity.create({
      data: {
        eventId,
        userId,
        action: 'COMMENT_ADDED',
        description: `New comment: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
      },
    });
  }

  async onEventUpdated(eventId: string, userId: string, changes: string[]) {
    await this.prisma.eventActivity.create({
      data: {
        eventId,
        userId,
        action: 'EVENT_UPDATED',
        description: `Event updated: ${changes.join(', ')}`,
      },
    });
  }

  async onRsvpChanged(eventId: string, userId: string, status: string) {
    await this.prisma.eventActivity.create({
      data: {
        eventId,
        userId,
        action: 'RSVP_CHANGED',
        description: `RSVP changed to ${status}`,
      },
    });
  }

  async onDocumentAttached(eventId: string, userId: string, documentName: string) {
    await this.prisma.eventActivity.create({
      data: {
        eventId,
        userId,
        action: 'DOCUMENT_ATTACHED',
        description: `Document attached: ${documentName}`,
      },
    });
  }

  async onMediaUploaded(eventId: string, userId: string, mediaType: string) {
    await this.prisma.eventActivity.create({
      data: {
        eventId,
        userId,
        action: 'MEDIA_UPLOADED',
        description: `New ${mediaType.toLowerCase()} uploaded`,
      },
    });
  }

  async onEventCancelled(eventId: string, userId: string, reason?: string) {
    await this.prisma.eventActivity.create({
      data: {
        eventId,
        userId,
        action: 'EVENT_CANCELLED',
        description: `Event cancelled${reason ? `: ${reason}` : ''}`,
      },
    });
  }

  async onEventDateChanged(eventId: string, userId: string, oldDate: string, newDate: string) {
    await this.prisma.eventActivity.create({
      data: {
        eventId,
        userId,
        action: 'DATE_CHANGED',
        description: `Date changed from ${new Date(oldDate).toLocaleDateString()} to ${new Date(newDate).toLocaleDateString()}`,
      },
    });
  }

  private generateNotification(eventType: string, title: string, memberName: string, date?: Date | null): string {
    const dateStr = date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

    switch (eventType) {
      case 'BIRTH':
        return `Birth announcement: ${memberName ? `${memberName} was born` : title}${dateStr ? ` on ${dateStr}` : ''}`;
      case 'MARRIAGE':
        return `Marriage announcement: ${title}${dateStr ? ` on ${dateStr}` : ''}`;
      case 'DEATH':
        return `In memory: ${title}${dateStr ? ` - ${dateStr}` : ''}`;
      case 'EDUCATION':
      case 'GRADUATION':
        return `Education milestone: ${title}${dateStr ? ` on ${dateStr}` : ''}`;
      case 'JOB':
      case 'PROMOTION':
      case 'CAREER':
        return `Career update: ${title}`;
      case 'MIGRATION':
        return `Migration notice: ${title}`;
      case 'MILITARY_SERVICE':
        return `Military service: ${title}`;
      case 'AWARD':
        return `Award received: ${title}`;
      case 'BUSINESS':
        return `Business milestone: ${title}`;
      case 'BIRTHDAY':
        return `Birthday: ${title}`;
      case 'ANNIVERSARY':
        return `Anniversary: ${title}`;
      case 'RETIREMENT':
        return `Retirement: ${title}`;
      default:
        return `${eventType.replace(/_/g, ' ').toLowerCase()}: ${title}`;
    }
  }
}
