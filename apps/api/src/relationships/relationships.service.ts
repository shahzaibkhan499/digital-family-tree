import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { NotificationsEventService } from '../notifications/notifications-event.service';
import { ActivityEventService } from '../activities/activity-event.service';
import { TimelineService } from '../timeline/timeline.service';
import { CreateRelationshipDto, RelationshipType } from './dto/create-relationship.dto';

const IMPOSSIBLE_RELATIONSHIPS: Record<string, any[]> = {
  [RelationshipType.FATHER]: [RelationshipType.FATHER, RelationshipType.MOTHER, RelationshipType.SON, RelationshipType.BROTHER, RelationshipType.SISTER, RelationshipType.WIFE, RelationshipType.HUSBAND],
  [RelationshipType.MOTHER]: [RelationshipType.FATHER, RelationshipType.MOTHER, RelationshipType.DAUGHTER, RelationshipType.BROTHER, RelationshipType.SISTER, RelationshipType.WIFE, RelationshipType.HUSBAND],
  [RelationshipType.SON]: [RelationshipType.FATHER, RelationshipType.MOTHER, RelationshipType.SON, RelationshipType.WIFE, RelationshipType.HUSBAND],
  [RelationshipType.DAUGHTER]: [RelationshipType.FATHER, RelationshipType.MOTHER, RelationshipType.DAUGHTER, RelationshipType.WIFE, RelationshipType.HUSBAND],
  [RelationshipType.HUSBAND]: [RelationshipType.HUSBAND, RelationshipType.SON, RelationshipType.DAUGHTER],
  [RelationshipType.WIFE]: [RelationshipType.WIFE, RelationshipType.SON, RelationshipType.DAUGHTER],
  [RelationshipType.BROTHER]: [RelationshipType.BROTHER, RelationshipType.SISTER, RelationshipType.HUSBAND, RelationshipType.WIFE],
  [RelationshipType.SISTER]: [RelationshipType.BROTHER, RelationshipType.SISTER, RelationshipType.HUSBAND, RelationshipType.WIFE],
  [RelationshipType.GRANDFATHER]: [RelationshipType.GRANDFATHER, RelationshipType.GRANDMOTHER, RelationshipType.GRANDSON, RelationshipType.GRANDDAUGHTER],
  [RelationshipType.GRANDMOTHER]: [RelationshipType.GRANDFATHER, RelationshipType.GRANDMOTHER, RelationshipType.GRANDSON, RelationshipType.GRANDDAUGHTER],
  [RelationshipType.GRANDSON]: [RelationshipType.GRANDFATHER, RelationshipType.GRANDMOTHER, RelationshipType.GRANDSON, RelationshipType.GRANDDAUGHTER],
  [RelationshipType.GRANDDAUGHTER]: [RelationshipType.GRANDFATHER, RelationshipType.GRANDMOTHER, RelationshipType.GRANDSON, RelationshipType.GRANDDAUGHTER],
};

@Injectable()
export class RelationshipsService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private notificationsEvent: NotificationsEventService,
    private activityEvent: ActivityEventService,
    private timelineService: TimelineService,
  ) {}

  async addRelationship(userId: string, dto: CreateRelationshipDto) {
    if (dto.fromMemberId === dto.toMemberId) {
      throw new BadRequestException('A member cannot have a relationship with themselves');
    }

    const fromMember = await this.prisma.familyMember.findUnique({
      where: { id: dto.fromMemberId },
      include: { family: { select: { id: true, ownerId: true } } },
    });

    if (!fromMember) {
      throw new NotFoundException('Source member not found');
    }

    if (fromMember.family.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this family');
    }

    const toMember = await this.prisma.familyMember.findUnique({
      where: { id: dto.toMemberId },
      include: { family: { select: { id: true } } },
    });

    if (!toMember) {
      throw new NotFoundException('Target member not found');
    }

    if (fromMember.familyId !== toMember.familyId) {
      throw new ForbiddenException('Both members must be in the same family');
    }

    const PARENT_TYPES = ['FATHER', 'MOTHER', 'GRANDFATHER', 'GRANDMOTHER'];
    if (PARENT_TYPES.includes(dto.type)) {
      const hasCycle = await this.detectCycle(dto.fromMemberId, dto.toMemberId);
      if (hasCycle) {
        throw new ConflictException('Adding this relationship would create a circular family tree');
      }
    }

    const impossibleForType = IMPOSSIBLE_RELATIONSHIPS[dto.type] || [];
    const existingReverse = await this.prisma.relationship.findFirst({
      where: {
        fromMemberId: dto.toMemberId,
        toMemberId: dto.fromMemberId,
        type: { in: impossibleForType },
      },
    });

    if (existingReverse) {
      throw new ConflictException(
        `Cannot create ${dto.type} relationship: member already has a ${existingReverse.type} relationship`,
      );
    }

    if (
      dto.type === RelationshipType.HUSBAND ||
      dto.type === RelationshipType.WIFE
    ) {
      const existingSpouse = await this.prisma.relationship.findFirst({
        where: {
          OR: [
            { fromMemberId: dto.fromMemberId, type: { in: [RelationshipType.HUSBAND, RelationshipType.WIFE] } },
            { toMemberId: dto.fromMemberId, type: { in: [RelationshipType.HUSBAND, RelationshipType.WIFE] } },
            { fromMemberId: dto.toMemberId, type: { in: [RelationshipType.HUSBAND, RelationshipType.WIFE] } },
            { toMemberId: dto.toMemberId, type: { in: [RelationshipType.HUSBAND, RelationshipType.WIFE] } },
          ],
        },
      });

      if (existingSpouse) {
        const isComplementary =
          (dto.type === RelationshipType.HUSBAND && existingSpouse.type === RelationshipType.WIFE &&
           dto.fromMemberId === existingSpouse.toMemberId && dto.toMemberId === existingSpouse.fromMemberId) ||
          (dto.type === RelationshipType.WIFE && existingSpouse.type === RelationshipType.HUSBAND &&
           dto.fromMemberId === existingSpouse.toMemberId && dto.toMemberId === existingSpouse.fromMemberId);
        if (!isComplementary) {
          throw new ConflictException('One of the members already has a spouse relationship');
        }
      }
    }

    if (
      dto.type === RelationshipType.FATHER ||
      dto.type === RelationshipType.MOTHER
    ) {
      const existingParent = await this.prisma.relationship.findFirst({
        where: {
          fromMemberId: dto.fromMemberId,
          type: { in: [RelationshipType.FATHER, RelationshipType.MOTHER] },
          toMemberId: dto.toMemberId,
        },
      });

      if (existingParent) {
        throw new ConflictException('This parent-child relationship already exists');
      }
    }

    const existing = await this.prisma.relationship.findUnique({
      where: {
        fromMemberId_toMemberId_type: {
          fromMemberId: dto.fromMemberId,
          toMemberId: dto.toMemberId,
          type: dto.type,
        },
      },
    });

    if (existing) {
      throw new ConflictException('This relationship already exists');
    }

    const displayId = await this.identityService.generateRelationshipId();

    const relationship = await this.prisma.relationship.create({
      data: {
        displayId,
        fromMemberId: dto.fromMemberId,
        toMemberId: dto.toMemberId,
        type: dto.type,
      },
      include: {
        fromMember: { select: { id: true, firstName: true, lastName: true } },
        toMember: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    this.notificationsEvent.emit({
      type: 'RELATIONSHIP_ADDED',
      title: 'Relationship Added',
      message: `${fromMember.firstName} ${fromMember.lastName} is now ${dto.type} of ${toMember.firstName} ${toMember.lastName}.`,
      userId,
      metadata: { relationshipId: relationship.id, type: dto.type },
    }).catch(() => {});

    this.activityEvent.emitRelationshipCreated(userId, fromMember.familyId, `${fromMember.firstName} ${fromMember.lastName}`, `${toMember.firstName} ${toMember.lastName}`, dto.type).catch(() => {});

    if (dto.type === RelationshipType.HUSBAND || dto.type === RelationshipType.WIFE) {
      this.timelineService.create({
        familyId: fromMember.familyId,
        eventType: 'MARRIAGE',
        title: `${fromMember.firstName} ${fromMember.lastName} and ${toMember.firstName} ${toMember.lastName} got married`,
        description: `${fromMember.firstName} and ${toMember.firstName} are now ${dto.type === RelationshipType.HUSBAND ? 'husband and wife' : 'married'}.`,
        isAuto: true,
      }).catch(() => {});
    }

    return relationship;
  }

  async listByFamily(familyId: string, userId: string) {
    const family = await this.prisma.family.findUnique({ where: { id: familyId } });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this family');
    }

    const members = await this.prisma.familyMember.findMany({
      where: { familyId },
      select: { id: true },
    });

    const memberIds = members.map((m) => m.id);

    return this.prisma.relationship.findMany({
      where: {
        OR: [
          { fromMemberId: { in: memberIds } },
          { toMemberId: { in: memberIds } },
        ],
      },
      include: {
        fromMember: { select: { id: true, firstName: true, lastName: true } },
        toMember: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async removeRelationship(relationshipId: string, userId: string) {
    const relationship = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        fromMember: {
          include: { family: { select: { ownerId: true } } },
        },
      },
    });

    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }

    if (relationship.fromMember.family.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this family');
    }

    await this.prisma.relationship.delete({ where: { id: relationshipId } });

    this.notificationsEvent.emit({
      type: 'RELATIONSHIP_REMOVED',
      title: 'Relationship Removed',
      message: `A ${relationship.type} relationship has been removed.`,
      userId,
      metadata: { relationshipId, type: relationship.type },
    }).catch(() => {});

    this.activityEvent.emitRelationshipRemoved(userId, relationship.fromMember.familyId, relationship.type).catch(() => {});

    return { message: 'Relationship removed successfully' };
  }

  private async detectCycle(fromMemberId: string, toMemberId: string): Promise<boolean> {
    const visited = new Set<string>();
    const queue = [fromMemberId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === toMemberId) return true;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const parents = await this.prisma.relationship.findMany({
        where: {
          toMemberId: currentId,
          type: { in: ['FATHER', 'MOTHER', 'GRANDFATHER', 'GRANDMOTHER'] },
        },
        select: { fromMemberId: true },
      });

      for (const rel of parents) {
        if (!visited.has(rel.fromMemberId)) {
          queue.push(rel.fromMemberId);
        }
      }
    }

    return false;
  }
}
