import { Injectable } from '@nestjs/common';
import { ActivityService } from './activity.service';

export interface ActivityEvent {
  userId: string;
  familyId?: string;
  memberId?: string;
  eventType: string;
  title: string;
  description?: string;
  visibility?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, any>;
  createdBy?: string;
}

@Injectable()
export class ActivityEventService {
  constructor(private activityService: ActivityService) {}

  async emit(event: ActivityEvent) {
    return this.activityService.create({
      userId: event.userId,
      familyId: event.familyId,
      memberId: event.memberId,
      eventType: event.eventType,
      title: event.title,
      description: event.description,
      visibility: event.visibility || 'FAMILY',
      entityType: event.entityType,
      entityId: event.entityId,
      entityName: event.entityName,
      metadata: event.metadata,
      createdBy: event.createdBy,
    });
  }

  async emitUserRegistered(userId: string, name: string) {
    return this.emit({
      userId,
      eventType: 'USER_REGISTERED',
      title: 'Joined the platform',
      description: `${name} created an account.`,
      visibility: 'PRIVATE',
      entityType: 'USER',
      entityId: userId,
      entityName: name,
    });
  }

  async emitProfileUpdated(userId: string, fields: string[]) {
    return this.emit({
      userId,
      eventType: 'PROFILE_UPDATED',
      title: 'Profile updated',
      description: `Updated ${fields.join(', ')}.`,
      visibility: 'PRIVATE',
      entityType: 'USER',
      entityId: userId,
      metadata: { fields },
    });
  }

  async emitAvatarChanged(userId: string) {
    return this.emit({
      userId,
      eventType: 'AVATAR_CHANGED',
      title: 'Avatar updated',
      visibility: 'PRIVATE',
      entityType: 'USER',
      entityId: userId,
    });
  }

  async emitCoverChanged(userId: string) {
    return this.emit({
      userId,
      eventType: 'COVER_CHANGED',
      title: 'Cover photo updated',
      visibility: 'PRIVATE',
      entityType: 'USER',
      entityId: userId,
    });
  }

  async emitFamilyCreated(userId: string, familyId: string, familyName: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'FAMILY_CREATED',
      title: 'Created a family',
      description: `Created family "${familyName}".`,
      visibility: 'FAMILY',
      entityType: 'FAMILY',
      entityId: familyId,
      entityName: familyName,
    });
  }

  async emitFamilyUpdated(userId: string, familyId: string, familyName: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'FAMILY_UPDATED',
      title: 'Updated family',
      description: `Updated family "${familyName}".`,
      visibility: 'FAMILY',
      entityType: 'FAMILY',
      entityId: familyId,
      entityName: familyName,
    });
  }

  async emitFamilyDeleted(userId: string, familyName: string) {
    return this.emit({
      userId,
      eventType: 'FAMILY_DELETED',
      title: 'Deleted a family',
      description: `Deleted family "${familyName}".`,
      visibility: 'PRIVATE',
      entityType: 'FAMILY',
      entityName: familyName,
    });
  }

  async emitMemberAdded(userId: string, familyId: string, memberName: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'MEMBER_ADDED',
      title: 'Added a member',
      description: `Added ${memberName} to the family.`,
      visibility: 'FAMILY',
      entityType: 'MEMBER',
      entityName: memberName,
    });
  }

  async emitMemberUpdated(userId: string, familyId: string, memberName: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'MEMBER_UPDATED',
      title: 'Updated a member',
      description: `Updated ${memberName}'s information.`,
      visibility: 'FAMILY',
      entityType: 'MEMBER',
      entityName: memberName,
    });
  }

  async emitMemberDeleted(userId: string, familyId: string, memberName: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'MEMBER_DELETED',
      title: 'Removed a member',
      description: `Removed ${memberName} from the family.`,
      visibility: 'FAMILY',
      entityType: 'MEMBER',
      entityName: memberName,
    });
  }

  async emitRelationshipCreated(userId: string, familyId: string, fromName: string, toName: string, type: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'RELATIONSHIP_CREATED',
      title: 'Created a relationship',
      description: `${fromName} is now ${type} of ${toName}.`,
      visibility: 'FAMILY',
      entityType: 'RELATIONSHIP',
      entityName: `${fromName} → ${type} → ${toName}`,
      metadata: { fromName, toName, type },
    });
  }

  async emitRelationshipRemoved(userId: string, familyId: string, type: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'RELATIONSHIP_REMOVED',
      title: 'Removed a relationship',
      description: `A ${type} relationship has been removed.`,
      visibility: 'FAMILY',
      entityType: 'RELATIONSHIP',
      metadata: { type },
    });
  }

  async emitInvitationSent(userId: string, familyId: string, familyName: string, email: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'INVITATION_SENT',
      title: 'Sent an invitation',
      description: `Invited ${email} to "${familyName}".`,
      visibility: 'FAMILY',
      entityType: 'INVITATION',
      entityName: familyName,
      metadata: { email },
    });
  }

  async emitInvitationAccepted(userId: string, familyId: string, familyName: string, userName: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'INVITATION_ACCEPTED',
      title: 'Invitation accepted',
      description: `${userName} accepted the invitation to "${familyName}".`,
      visibility: 'FAMILY',
      entityType: 'INVITATION',
      entityName: familyName,
    });
  }

  async emitInvitationDeclined(userId: string, familyId: string, familyName: string, userName: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'INVITATION_DECLINED',
      title: 'Invitation declined',
      description: `${userName} declined the invitation to "${familyName}".`,
      visibility: 'FAMILY',
      entityType: 'INVITATION',
      entityName: familyName,
    });
  }

  async emitMergeRequest(userId: string, sourceFamilyId: string, sourceName: string, targetName: string) {
    return this.emit({
      userId,
      familyId: sourceFamilyId,
      eventType: 'MERGE_REQUEST',
      title: 'Merge request sent',
      description: `Requested to merge "${sourceName}" into "${targetName}".`,
      visibility: 'FAMILY',
      entityType: 'MERGE',
      metadata: { sourceName, targetName },
    });
  }

  async emitMergeApproved(userId: string, familyId: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'MERGE_APPROVED',
      title: 'Merge approved',
      description: 'Family merge has been completed.',
      visibility: 'FAMILY',
      entityType: 'MERGE',
    });
  }

  async emitMergeRejected(userId: string, familyId: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'MERGE_REJECTED',
      title: 'Merge rejected',
      description: 'Family merge request has been rejected.',
      visibility: 'FAMILY',
      entityType: 'MERGE',
    });
  }

  async emitSecurityEvent(userId: string, eventType: string, title: string, description: string) {
    return this.emit({
      userId,
      eventType,
      title,
      description,
      visibility: 'PRIVATE',
      entityType: 'SECURITY',
    });
  }

  async emitAdminAction(userId: string, title: string, description: string, metadata?: Record<string, any>) {
    return this.emit({
      userId,
      eventType: 'ADMIN_ACTION',
      title,
      description,
      visibility: 'PRIVATE',
      entityType: 'ADMIN',
      metadata,
    });
  }

  async emitCommentAdded(userId: string, familyId: string | undefined, activityId: string, commenterName: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'COMMENT_ADDED',
      title: 'New comment',
      description: `${commenterName} commented on an activity.`,
      visibility: 'FAMILY',
      entityType: 'COMMENT',
      entityId: activityId,
    });
  }

  async emitReactionAdded(userId: string, familyId: string | undefined, activityId: string, reactionType: string) {
    return this.emit({
      userId,
      familyId,
      eventType: 'REACTION_ADDED',
      title: 'New reaction',
      description: `Reacted with ${reactionType}.`,
      visibility: 'FAMILY',
      entityType: 'REACTION',
      entityId: activityId,
      metadata: { reactionType },
    });
  }
}
