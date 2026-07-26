import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { NotificationsEventService } from '../notifications/notifications-event.service';
import { ActivityEventService } from '../activities/activity-event.service';

@Injectable()
export class MergeService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private notificationsEvent: NotificationsEventService,
    private activityEvent: ActivityEventService,
  ) {}

  async createMergeRequest(userId: string, sourceFamilyId: string, targetFamilyId: string) {
    const sourceFamily = await this.prisma.family.findUnique({ where: { id: sourceFamilyId } });
    if (!sourceFamily) throw new NotFoundException('Source family not found');
    if (sourceFamily.ownerId !== userId) throw new ForbiddenException('You can only merge families you own');

    const targetFamily = await this.prisma.family.findUnique({ where: { id: targetFamilyId } });
    if (!targetFamily) throw new NotFoundException('Target family not found');

    if (sourceFamilyId === targetFamilyId) {
      throw new BadRequestException('Cannot merge a family with itself');
    }

    const existingRequest = await this.prisma.familyMergeRequest.findFirst({
      where: {
        sourceFamilyId,
        targetFamilyId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingRequest) {
      throw new ConflictException('A merge request already exists between these families');
    }

    const sourceMembers = await this.prisma.familyMember.findMany({
      where: { familyId: sourceFamilyId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, birthDate: true },
    });

    const targetMembers = await this.prisma.familyMember.findMany({
      where: { familyId: targetFamilyId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, birthDate: true },
    });

    const conflicts: any[] = [];

    for (const sm of sourceMembers) {
      for (const tm of targetMembers) {
        if (
          sm.firstName.toLowerCase() === tm.firstName.toLowerCase() &&
          sm.lastName.toLowerCase() === tm.lastName.toLowerCase()
        ) {
          conflicts.push({
            type: 'NAME_MATCH',
            sourceMember: sm,
            targetMember: tm,
          });
        }
        if (sm.email && tm.email && sm.email.toLowerCase() === tm.email.toLowerCase()) {
          conflicts.push({
            type: 'EMAIL_MATCH',
            sourceMember: sm,
            targetMember: tm,
          });
        }
      }
    }

    const displayId = await this.identityService.generateRelationshipId();

    const mergeRequest = await this.prisma.familyMergeRequest.create({
      data: {
        displayId,
        sourceFamilyId,
        targetFamilyId,
        requesterId: userId,
        conflictData: conflicts.length > 0 ? JSON.stringify(conflicts) : null,
      },
      include: {
        sourceFamily: { select: { id: true, name: true, displayId: true } },
        targetFamily: { select: { id: true, name: true, displayId: true } },
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    await this.prisma.mergeAuditLog.create({
      data: {
        mergeRequestId: mergeRequest.id,
        action: 'REQUEST_CREATED',
        performedById: userId,
        details: JSON.stringify({
          sourceFamily: sourceFamily.name,
          targetFamily: targetFamily.name,
          conflictCount: conflicts.length,
        }),
      },
    });

    this.notificationsEvent.emit({
      type: 'MERGE_REQUEST',
      title: 'Family Merge Request',
      message: `A merge request has been sent for "${targetFamily.name}".`,
      userId: targetFamily.ownerId,
      actionUrl: '/dashboard/families',
      priority: 'HIGH',
      metadata: { sourceFamilyId, targetFamilyId, sourceFamilyName: sourceFamily.name, targetFamilyName: targetFamily.name },
    }).catch(() => {});

    this.activityEvent.emitMergeRequest(userId, sourceFamilyId, sourceFamily.name, targetFamily.name).catch(() => {});

    return {
      ...mergeRequest,
      conflicts,
      hasConflicts: conflicts.length > 0,
    };
  }

  async approveMergeRequest(userId: string, requestId: string) {
    const request = await this.prisma.familyMergeRequest.findUnique({
      where: { id: requestId },
      include: {
        sourceFamily: { select: { id: true, name: true, ownerId: true } },
        targetFamily: { select: { id: true, name: true, ownerId: true } },
      },
    });

    if (!request) throw new NotFoundException('Merge request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('This request is no longer pending');
    if (request.targetFamily.ownerId !== userId) throw new ForbiddenException('Only the target family owner can approve');

    const sourceMembers = await this.prisma.familyMember.findMany({
      where: { familyId: request.sourceFamilyId },
      include: { fromRelationships: true, toRelationships: true },
    });

    const targetMembers = await this.prisma.familyMember.findMany({
      where: { familyId: request.targetFamilyId },
    });

    const migratedMemberIds: string[] = [];

    for (const member of sourceMembers) {
      const duplicate = targetMembers.find(
        (tm) =>
          tm.firstName.toLowerCase() === member.firstName.toLowerCase() &&
          tm.lastName.toLowerCase() === member.lastName.toLowerCase(),
      );

      if (!duplicate) {
        const newDisplayId = await this.identityService.generateMemberId();
        const newMember = await this.prisma.familyMember.create({
          data: {
            displayId: newDisplayId,
            sharedId: member.sharedId,
            familyId: request.targetFamilyId,
            firstName: member.firstName,
            lastName: member.lastName,
            middleName: member.middleName,
            nickname: member.nickname,
            birthDate: member.birthDate,
            deathDate: member.deathDate,
            gender: member.gender,
            bio: member.bio,
            avatar: member.avatar,
            email: member.email,
            phone: member.phone,
            whatsapp: member.whatsapp,
            address: member.address,
            city: member.city,
            country: member.country,
            occupation: member.occupation,
            notes: member.notes,
            governmentId: member.governmentId,
          },
        });
        migratedMemberIds.push(newMember.id);
      }
    }

    await this.prisma.relationship.deleteMany({
      where: { fromMemberId: { in: sourceMembers.map((m) => m.id) } },
    });

    await this.prisma.familyMember.deleteMany({
      where: { familyId: request.sourceFamilyId },
    });

    await this.prisma.familyMergeRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approverId: userId,
        resolvedAt: new Date(),
      },
    });

    await this.prisma.mergeAuditLog.create({
      data: {
        mergeRequestId: requestId,
        action: 'REQUEST_APPROVED',
        performedById: userId,
        details: JSON.stringify({
          migratedMembers: migratedMemberIds.length,
          sourceFamilyDeleted: true,
        }),
      },
    });

    await this.prisma.family.delete({ where: { id: request.sourceFamilyId } });

    this.notificationsEvent.emit({
      type: 'MERGE_APPROVED',
      title: 'Merge Approved',
      message: `The family merge has been approved and completed.`,
      userId: request.requesterId,
      actionUrl: '/dashboard/families',
      priority: 'HIGH',
      metadata: { requestId, migratedMembers: migratedMemberIds.length },
    }).catch(() => {});

    this.activityEvent.emitMergeApproved(request.requesterId, request.targetFamilyId).catch(() => {});

    return {
      message: 'Merge completed successfully',
      migratedMembers: migratedMemberIds.length,
    };
  }

  async rejectMergeRequest(userId: string, requestId: string) {
    const request = await this.prisma.familyMergeRequest.findUnique({
      where: { id: requestId },
      include: { targetFamily: { select: { ownerId: true } } },
    });

    if (!request) throw new NotFoundException('Merge request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('This request is no longer pending');
    if (request.targetFamily.ownerId !== userId) throw new ForbiddenException('Only the target family owner can reject');

    await this.prisma.familyMergeRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approverId: userId,
        resolvedAt: new Date(),
      },
    });

    await this.prisma.mergeAuditLog.create({
      data: {
        mergeRequestId: requestId,
        action: 'REQUEST_REJECTED',
        performedById: userId,
      },
    });

    this.notificationsEvent.emit({
      type: 'MERGE_REJECTED',
      title: 'Merge Rejected',
      message: `The family merge request has been rejected.`,
      userId: request.requesterId,
      metadata: { requestId },
    }).catch(() => {});

    this.activityEvent.emitMergeRejected(request.requesterId, request.targetFamilyId).catch(() => {});

    return { message: 'Merge request rejected' };
  }

  async listMergeRequests(userId: string) {
    const families = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const familyIds = families.map((f) => f.id);

    return this.prisma.familyMergeRequest.findMany({
      where: {
        OR: [
          { sourceFamilyId: { in: familyIds } },
          { targetFamilyId: { in: familyIds } },
        ],
      },
      include: {
        sourceFamily: { select: { id: true, name: true, displayId: true } },
        targetFamily: { select: { id: true, name: true, displayId: true } },
        requester: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMergePreview(userId: string, sourceMemberId: string, targetMemberId: string) {
    if (!sourceMemberId || !targetMemberId) {
      throw new BadRequestException('sourceMemberId and targetMemberId query parameters are required');
    }

    const sourceMember = await this.prisma.familyMember.findUnique({
      where: { id: sourceMemberId },
      include: {
        family: { select: { id: true, name: true, ownerId: true } },
        fromRelationships: {
          include: {
            toMember: { select: { id: true, firstName: true, lastName: true, avatar: true, family: { select: { id: true, name: true } } } },
          },
        },
        toRelationships: {
          include: {
            fromMember: { select: { id: true, firstName: true, lastName: true, avatar: true, family: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    const targetMember = await this.prisma.familyMember.findUnique({
      where: { id: targetMemberId },
      include: {
        family: { select: { id: true, name: true, ownerId: true } },
        fromRelationships: {
          include: {
            toMember: { select: { id: true, firstName: true, lastName: true, avatar: true, family: { select: { id: true, name: true } } } },
          },
        },
        toRelationships: {
          include: {
            fromMember: { select: { id: true, firstName: true, lastName: true, avatar: true, family: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    if (!sourceMember || !targetMember) {
      throw new NotFoundException('One or both members not found');
    }

    if (sourceMember.family.ownerId !== userId && targetMember.family.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const differences = this.calculateFieldDiff(sourceMember, targetMember);

    const sourceTimeline = await this.prisma.timelineEvent.findMany({
      where: { memberId: sourceMemberId },
      select: { id: true, eventType: true, title: true, date: true },
      orderBy: { date: 'asc' },
    });

    const targetTimeline = await this.prisma.timelineEvent.findMany({
      where: { memberId: targetMemberId },
      select: { id: true, eventType: true, title: true, date: true },
      orderBy: { date: 'asc' },
    });

    return {
      source: {
        id: sourceMember.id,
        displayId: sourceMember.displayId,
        firstName: sourceMember.firstName,
        lastName: sourceMember.lastName,
        middleName: sourceMember.middleName,
        nickname: sourceMember.nickname,
        birthDate: sourceMember.birthDate,
        deathDate: sourceMember.deathDate,
        gender: sourceMember.gender,
        bio: sourceMember.bio,
        avatar: sourceMember.avatar,
        email: sourceMember.email,
        phone: sourceMember.phone,
        whatsapp: sourceMember.whatsapp,
        address: sourceMember.address,
        city: sourceMember.city,
        country: sourceMember.country,
        occupation: sourceMember.occupation,
        notes: sourceMember.notes,
        governmentId: sourceMember.governmentId,
        family: sourceMember.family,
        relationships: {
          outgoing: sourceMember.fromRelationships,
          incoming: sourceMember.toRelationships,
        },
        timeline: sourceTimeline,
      },
      target: {
        id: targetMember.id,
        displayId: targetMember.displayId,
        firstName: targetMember.firstName,
        lastName: targetMember.lastName,
        middleName: targetMember.middleName,
        nickname: targetMember.nickname,
        birthDate: targetMember.birthDate,
        deathDate: targetMember.deathDate,
        gender: targetMember.gender,
        bio: targetMember.bio,
        avatar: targetMember.avatar,
        email: targetMember.email,
        phone: targetMember.phone,
        whatsapp: targetMember.whatsapp,
        address: targetMember.address,
        city: targetMember.city,
        country: targetMember.country,
        occupation: targetMember.occupation,
        notes: targetMember.notes,
        governmentId: targetMember.governmentId,
        family: targetMember.family,
        relationships: {
          outgoing: targetMember.fromRelationships,
          incoming: targetMember.toRelationships,
        },
        timeline: targetTimeline,
      },
      differences,
    };
  }

  async executeMerge(
    userId: string,
    sourceMemberId: string,
    targetMemberId: string,
    strategy: 'KEEP_LEFT' | 'KEEP_RIGHT' | 'MERGE_BOTH',
  ) {
    const sourceMember = await this.prisma.familyMember.findUnique({
      where: { id: sourceMemberId },
      include: { family: { select: { id: true, ownerId: true } } },
    });

    const targetMember = await this.prisma.familyMember.findUnique({
      where: { id: targetMemberId },
      include: { family: { select: { id: true, ownerId: true } } },
    });

    if (!sourceMember || !targetMember) {
      throw new NotFoundException('One or both members not found');
    }

    if (sourceMember.family.ownerId !== userId && targetMember.family.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (sourceMemberId === targetMemberId) {
      throw new BadRequestException('Cannot merge a member with itself');
    }

    const displayId = await this.identityService.generateMergeSnapshotId();

    const sourceSnapshot = {
      id: sourceMember.id,
      displayId: sourceMember.displayId,
      firstName: sourceMember.firstName,
      lastName: sourceMember.lastName,
      middleName: sourceMember.middleName,
      nickname: sourceMember.nickname,
      birthDate: sourceMember.birthDate,
      deathDate: sourceMember.deathDate,
      gender: sourceMember.gender,
      bio: sourceMember.bio,
      avatar: sourceMember.avatar,
      email: sourceMember.email,
      phone: sourceMember.phone,
      whatsapp: sourceMember.whatsapp,
      address: sourceMember.address,
      city: sourceMember.city,
      country: sourceMember.country,
      occupation: sourceMember.occupation,
      notes: sourceMember.notes,
      governmentId: sourceMember.governmentId,
      familyId: sourceMember.familyId,
    };

    const targetSnapshot = {
      id: targetMember.id,
      displayId: targetMember.displayId,
      firstName: targetMember.firstName,
      lastName: targetMember.lastName,
      middleName: targetMember.middleName,
      nickname: targetMember.nickname,
      birthDate: targetMember.birthDate,
      deathDate: targetMember.deathDate,
      gender: targetMember.gender,
      bio: targetMember.bio,
      avatar: targetMember.avatar,
      email: targetMember.email,
      phone: targetMember.phone,
      whatsapp: targetMember.whatsapp,
      address: targetMember.address,
      city: targetMember.city,
      country: targetMember.country,
      occupation: targetMember.occupation,
      notes: targetMember.notes,
      governmentId: targetMember.governmentId,
      familyId: targetMember.familyId,
    };

    const snapshot = await this.prisma.mergeSnapshot.create({
      data: {
        displayId,
        sourceMemberId,
        targetMemberId,
        sourceSnapshot,
        targetSnapshot,
        mergeResult: {},
        strategy,
        performedById: userId,
      },
    });

    const mergeResult = await this.prisma.$transaction(async (tx) => {
      let result: any = {};

      if (strategy === 'KEEP_LEFT') {
        result = await tx.familyMember.update({
          where: { id: sourceMemberId },
          data: {},
          include: { family: { select: { id: true, name: true } } },
        });

        await tx.relationship.deleteMany({
          where: {
            OR: [
              { fromMemberId: targetMemberId },
              { toMemberId: targetMemberId },
            ],
          },
        });

        await tx.familyMember.delete({ where: { id: targetMemberId } });

        await tx.relationship.updateMany({
          where: { toMemberId: targetMemberId },
          data: { toMemberId: sourceMemberId },
        });

        await tx.relationship.updateMany({
          where: { fromMemberId: targetMemberId },
          data: { fromMemberId: sourceMemberId },
        });
      } else if (strategy === 'KEEP_RIGHT') {
        const moveData: any = {};

        if (sourceMember.email && !targetMember.email) moveData.email = sourceMember.email;
        if (sourceMember.phone && !targetMember.phone) moveData.phone = sourceMember.phone;
        if (sourceMember.city && !targetMember.city) moveData.city = sourceMember.city;
        if (sourceMember.country && !targetMember.country) moveData.country = sourceMember.country;
        if (sourceMember.occupation && !targetMember.occupation) moveData.occupation = sourceMember.occupation;
        if (sourceMember.bio && !targetMember.bio) moveData.bio = sourceMember.bio;
        if (sourceMember.avatar && !targetMember.avatar) moveData.avatar = sourceMember.avatar;

        result = await tx.familyMember.update({
          where: { id: targetMemberId },
          data: moveData,
          include: { family: { select: { id: true, name: true } } },
        });

        await tx.relationship.deleteMany({
          where: {
            OR: [
              { fromMemberId: sourceMemberId },
              { toMemberId: sourceMemberId },
            ],
          },
        });

        await tx.familyMember.delete({ where: { id: sourceMemberId } });
      } else if (strategy === 'MERGE_BOTH') {
        const mergedData: any = {};

        const fields = [
          'firstName', 'lastName', 'middleName', 'nickname', 'birthDate', 'deathDate',
          'gender', 'bio', 'avatar', 'email', 'phone', 'whatsapp', 'address',
          'city', 'country', 'occupation', 'notes', 'governmentId',
        ];

        for (const field of fields) {
          const sourceVal = sourceMember[field as keyof typeof sourceMember];
          const targetVal = targetMember[field as keyof typeof targetMember];
          if (targetVal) {
            mergedData[field] = targetVal;
          } else if (sourceVal) {
            mergedData[field] = sourceVal;
          }
        }

        result = await tx.familyMember.update({
          where: { id: targetMemberId },
          data: mergedData,
          include: { family: { select: { id: true, name: true } } },
        });

        await tx.relationship.deleteMany({
          where: {
            OR: [
              { fromMemberId: sourceMemberId },
              { toMemberId: sourceMemberId },
            ],
          },
        });

        await tx.familyMember.delete({ where: { id: sourceMemberId } });
      }

      return result;
    });

    await this.prisma.mergeSnapshot.update({
      where: { id: snapshot.id },
      data: { mergeResult: mergeResult as any },
    });

    return {
      snapshot: { ...snapshot, mergeResult },
      mergedMember: mergeResult,
      strategy,
    };
  }

  async undoMerge(userId: string, snapshotId: string) {
    const snapshot = await this.prisma.mergeSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      throw new NotFoundException('Merge snapshot not found');
    }

    if (snapshot.performedById !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (snapshot.undone) {
      throw new BadRequestException('This merge has already been undone');
    }

    const sourceData = snapshot.sourceSnapshot as any;
    const targetData = snapshot.targetSnapshot as any;

    const sourceExisting = await this.prisma.familyMember.findUnique({
      where: { id: snapshot.sourceMemberId },
    });

    const targetExisting = await this.prisma.familyMember.findUnique({
      where: { id: snapshot.targetMemberId },
    });

    if (!sourceExisting && !targetExisting) {
      throw new BadRequestException('Cannot undo: both members have been deleted externally');
    }

    const strategy = snapshot.strategy;

    if (strategy === 'KEEP_LEFT') {
      if (sourceExisting) {
        await this.prisma.familyMember.update({
          where: { id: snapshot.sourceMemberId },
          data: {
            firstName: sourceData.firstName,
            lastName: sourceData.lastName,
            middleName: sourceData.middleName,
            nickname: sourceData.nickname,
            birthDate: sourceData.birthDate,
            deathDate: sourceData.deathDate,
            gender: sourceData.gender,
            bio: sourceData.bio,
            avatar: sourceData.avatar,
            email: sourceData.email,
            phone: sourceData.phone,
            whatsapp: sourceData.whatsapp,
            address: sourceData.address,
            city: sourceData.city,
            country: sourceData.country,
            occupation: sourceData.occupation,
            notes: sourceData.notes,
            governmentId: sourceData.governmentId,
          },
        });
      }
      if (!targetExisting) {
        await this.prisma.familyMember.create({
          data: {
            displayId: targetData.displayId,
            familyId: targetData.familyId,
            firstName: targetData.firstName,
            lastName: targetData.lastName,
            middleName: targetData.middleName,
            nickname: targetData.nickname,
            birthDate: targetData.birthDate,
            deathDate: targetData.deathDate,
            gender: targetData.gender,
            bio: targetData.bio,
            avatar: targetData.avatar,
            email: targetData.email,
            phone: targetData.phone,
            whatsapp: targetData.whatsapp,
            address: targetData.address,
            city: targetData.city,
            country: targetData.country,
            occupation: targetData.occupation,
            notes: targetData.notes,
            governmentId: targetData.governmentId,
          },
        });
      }
    } else if (strategy === 'KEEP_RIGHT' || strategy === 'MERGE_BOTH') {
      if (!sourceExisting) {
        await this.prisma.familyMember.create({
          data: {
            displayId: sourceData.displayId,
            familyId: sourceData.familyId,
            firstName: sourceData.firstName,
            lastName: sourceData.lastName,
            middleName: sourceData.middleName,
            nickname: sourceData.nickname,
            birthDate: sourceData.birthDate,
            deathDate: sourceData.deathDate,
            gender: sourceData.gender,
            bio: sourceData.bio,
            avatar: sourceData.avatar,
            email: sourceData.email,
            phone: sourceData.phone,
            whatsapp: sourceData.whatsapp,
            address: sourceData.address,
            city: sourceData.city,
            country: sourceData.country,
            occupation: sourceData.occupation,
            notes: sourceData.notes,
            governmentId: sourceData.governmentId,
          },
        });
      }
      if (targetExisting) {
        await this.prisma.familyMember.update({
          where: { id: snapshot.targetMemberId },
          data: {
            firstName: targetData.firstName,
            lastName: targetData.lastName,
            middleName: targetData.middleName,
            nickname: targetData.nickname,
            birthDate: targetData.birthDate,
            deathDate: targetData.deathDate,
            gender: targetData.gender,
            bio: targetData.bio,
            avatar: targetData.avatar,
            email: targetData.email,
            phone: targetData.phone,
            whatsapp: targetData.whatsapp,
            address: targetData.address,
            city: targetData.city,
            country: targetData.country,
            occupation: targetData.occupation,
            notes: targetData.notes,
            governmentId: targetData.governmentId,
          },
        });
      }
    }

    await this.prisma.mergeSnapshot.update({
      where: { id: snapshotId },
      data: {
        undone: true,
        undoneAt: new Date(),
        undoneById: userId,
      },
    });

    return { message: 'Merge undone successfully', snapshotId };
  }

  async getMergeHistory(userId: string) {
    return this.prisma.mergeSnapshot.findMany({
      where: { performedById: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMergeSnapshot(id: string, userId: string) {
    const snapshot = await this.prisma.mergeSnapshot.findUnique({
      where: { id },
    });

    if (!snapshot) {
      throw new NotFoundException('Merge snapshot not found');
    }

    if (snapshot.performedById !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return snapshot;
  }

  calculateFieldDiff(source: any, target: any): Record<string, { source: any; target: any; conflict: boolean }> {
    const fields = [
      'firstName', 'lastName', 'middleName', 'nickname', 'birthDate', 'deathDate',
      'gender', 'bio', 'email', 'phone', 'whatsapp', 'address',
      'city', 'country', 'occupation', 'notes',
    ];

    const diff: Record<string, { source: any; target: any; conflict: boolean }> = {};

    for (const field of fields) {
      const sourceVal = source[field] ?? null;
      const targetVal = target[field] ?? null;
      const conflict = sourceVal !== null && targetVal !== null && String(sourceVal) !== String(targetVal);

      diff[field] = {
        source: sourceVal,
        target: targetVal,
        conflict,
      };
    }

    return diff;
  }

  levenshteinSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;
    if (a === b) return 1;

    const lenA = a.length;
    const lenB = b.length;

    if (lenA === 0) return 0;
    if (lenB === 0) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= lenA; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= lenB; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    const maxLen = Math.max(lenA, lenB);
    return 1 - matrix[lenA][lenB] / maxLen;
  }

  soundex(name: string): string {
    if (!name) return '';

    const upper = name.toUpperCase().trim();
    const first = upper[0];
    const tail = upper.slice(1).replace(/[AEIOUYHW]/g, '');

    const map: Record<string, string> = {
      'B': '1', 'F': '1', 'P': '1', 'V': '1',
      'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
      'D': '3', 'T': '3',
      'L': '4',
      'M': '5', 'N': '5',
      'R': '6',
    };

    let encoded = '';
    let previousCode = '';
    for (const ch of tail) {
      const code = map[ch];
      if (!code) {
        continue;
      }

      if (encoded.length === 0 && first === 'P' && ch === 'F') {
        continue;
      }

      if (code !== previousCode) {
        encoded += code;
        previousCode = code;
      }
    }

    return (first + encoded + '000').slice(0, 4);
  }

  async getMergeAuditLog(requestId: string, userId: string) {
    const request = await this.prisma.familyMergeRequest.findUnique({
      where: { id: requestId },
      include: {
        sourceFamily: { select: { ownerId: true } },
        targetFamily: { select: { ownerId: true } },
      },
    });

    if (!request) throw new NotFoundException('Merge request not found');
    if (request.sourceFamily.ownerId !== userId && request.targetFamily.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.mergeAuditLog.findMany({
      where: { mergeRequestId: requestId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
