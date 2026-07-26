import { Injectable } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationEvent {
  type: string;
  category?: string;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  priority?: string;
  userId: string;
  createdBy?: string;
}

@Injectable()
export class NotificationsEventService {
  constructor(
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  private getIconForType(type: string): string {
    const icons: Record<string, string> = {
      WELCOME: 'user-plus',
      PROFILE_COMPLETED: 'check-circle',
      PROFILE_APPROVED: 'badge-check',
      FAMILY_CREATED: 'home',
      FAMILY_DELETED: 'trash',
      FAMILY_INVITATION: 'mail',
      INVITATION_ACCEPTED: 'check',
      INVITATION_DECLINED: 'x-circle',
      MEMBER_ADDED: 'user-plus',
      MEMBER_UPDATED: 'edit',
      MEMBER_DELETED: 'user-minus',
      RELATIONSHIP_ADDED: 'link',
      RELATIONSHIP_UPDATED: 'refresh-cw',
      RELATIONSHIP_REMOVED: 'unlink',
      MERGE_REQUEST: 'git-merge',
      MERGE_APPROVED: 'check-circle',
      MERGE_REJECTED: 'x-circle',
      BIRTHDAY_REMINDER: 'cake',
      DEATH_ANNIVERSARY: 'heart',
      MEMORY_REMINDER: 'star',
      TIMELINE_MENTION: 'at-sign',
      COMMENT: 'message-circle',
      REACTION: 'heart',
      DOCUMENT_UPLOADED: 'file',
      DOCUMENT_APPROVED: 'file-check',
      DOCUMENT_REJECTED: 'file-x',
      LOGIN_ALERT: 'shield',
      PASSWORD_CHANGED: 'lock',
      EMAIL_CHANGED: 'mail',
      USERNAME_CHANGED: 'at-sign',
      TWO_FACTOR_ENABLED: 'shield-check',
      SUSPICIOUS_LOGIN: 'alert-triangle',
      ADMIN_ANNOUNCEMENT: 'megaphone',
      SYSTEM_MAINTENANCE: 'tool',
      SUBSCRIPTION: 'credit-card',
      PAYMENT: 'dollar-sign',
      STORAGE_LIMIT: 'hard-drive',
    };
    return icons[type] || 'bell';
  }

  private getCategoryForType(type: string): string {
    const categories: Record<string, string> = {
      WELCOME: 'ACCOUNT',
      PROFILE_COMPLETED: 'ACCOUNT',
      PROFILE_APPROVED: 'ACCOUNT',
      FAMILY_CREATED: 'FAMILY',
      FAMILY_DELETED: 'FAMILY',
      FAMILY_INVITATION: 'INVITATION',
      INVITATION_ACCEPTED: 'INVITATION',
      INVITATION_DECLINED: 'INVITATION',
      MEMBER_ADDED: 'FAMILY',
      MEMBER_UPDATED: 'FAMILY',
      MEMBER_DELETED: 'FAMILY',
      RELATIONSHIP_ADDED: 'FAMILY',
      RELATIONSHIP_UPDATED: 'FAMILY',
      RELATIONSHIP_REMOVED: 'FAMILY',
      MERGE_REQUEST: 'FAMILY',
      MERGE_APPROVED: 'FAMILY',
      MERGE_REJECTED: 'FAMILY',
      BIRTHDAY_REMINDER: 'REMINDER',
      DEATH_ANNIVERSARY: 'REMINDER',
      MEMORY_REMINDER: 'REMINDER',
      TIMELINE_MENTION: 'SOCIAL',
      COMMENT: 'SOCIAL',
      REACTION: 'SOCIAL',
      DOCUMENT_UPLOADED: 'DOCUMENT',
      DOCUMENT_APPROVED: 'DOCUMENT',
      DOCUMENT_REJECTED: 'DOCUMENT',
      LOGIN_ALERT: 'SECURITY',
      PASSWORD_CHANGED: 'SECURITY',
      EMAIL_CHANGED: 'SECURITY',
      USERNAME_CHANGED: 'SECURITY',
      TWO_FACTOR_ENABLED: 'SECURITY',
      SUSPICIOUS_LOGIN: 'SECURITY',
      ADMIN_ANNOUNCEMENT: 'ADMIN',
      SYSTEM_MAINTENANCE: 'ADMIN',
      SUBSCRIPTION: 'BILLING',
      PAYMENT: 'BILLING',
      STORAGE_LIMIT: 'BILLING',
    };
    return categories[type] || 'GENERAL';
  }

  async emit(event: NotificationEvent) {
    const prefs = await this.notificationsService.getPreferences(event.userId);

    const shouldSendInApp = prefs.inAppNotifications;
    if (!shouldSendInApp) return null;

    const shouldSendForCategory = this.shouldSendForCategory(event.category || this.getCategoryForType(event.type), prefs);
    if (!shouldSendForCategory) return null;

    return this.notificationsService.create({
      userId: event.userId,
      title: event.title,
      message: event.message,
      type: event.type,
      category: event.category || this.getCategoryForType(event.type),
      priority: event.priority || 'NORMAL',
      icon: event.icon || this.getIconForType(event.type),
      actionUrl: event.actionUrl,
      metadata: event.metadata,
      createdBy: event.createdBy,
    });
  }

  async emitToUser(userId: string, type: string, title: string, message: string, metadata?: Record<string, any>) {
    return this.emit({ type, title, message, userId, metadata });
  }

  async emitToFamily(familyId: string, type: string, title: string, message: string, excludeUserId?: string, metadata?: Record<string, any>) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { ownerId: true },
    });

    if (!family) return [];

    const notifications = [];

    if (excludeUserId !== family.ownerId) {
      const notif = await this.emit({
        type, title, message,
        userId: family.ownerId,
        actionUrl: `/dashboard/families/${familyId}`,
        metadata,
      });
      if (notif) notifications.push(notif);
    }

    return notifications;
  }

  async emitToMany(userIds: string[], type: string, title: string, message: string, metadata?: Record<string, any>) {
    const notifications = [];
    for (const userId of userIds) {
      const notif = await this.emit({ type, title, message, userId, metadata });
      if (notif) notifications.push(notif);
    }
    return notifications;
  }

  private shouldSendForCategory(category: string, prefs: any): boolean {
    const map: Record<string, boolean> = {
      ACCOUNT: true,
      FAMILY: prefs.familyUpdates,
      INVITATION: prefs.invitationNotifications,
      REMINDER: prefs.birthdayReminders,
      SOCIAL: true,
      DOCUMENT: prefs.familyUpdates,
      SECURITY: prefs.securityAlerts,
      ADMIN: prefs.adminAnnouncements,
      BILLING: true,
      GENERAL: true,
    };
    return map[category] !== false;
  }
}
