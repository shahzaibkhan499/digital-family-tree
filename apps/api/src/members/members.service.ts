import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { NotificationsEventService } from '../notifications/notifications-event.service';
import { ActivityEventService } from '../activities/activity-event.service';
import { TimelineService } from '../timeline/timeline.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private notificationsEvent: NotificationsEventService,
    private activityEvent: ActivityEventService,
    private timelineService: TimelineService,
  ) {}

  async create(familyId: string, userId: string, dto: CreateMemberDto) {
    const family = await this.prisma.family.findUnique({ where: { id: familyId } });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this family');
    }

    if (dto.email) {
      const existingMember = await this.prisma.familyMember.findFirst({
        where: {
          email: dto.email.toLowerCase().trim(),
          familyId: { not: familyId },
        },
        include: { family: { select: { id: true, name: true } } },
      });

      if (existingMember) {
        throw new ConflictException({
          message: 'A member with this email already exists',
          duplicate: true,
          existingMember: {
            id: existingMember.id,
            displayId: existingMember.displayId,
            firstName: existingMember.firstName,
            lastName: existingMember.lastName,
            email: existingMember.email,
            family: existingMember.family,
          },
        });
      }
    }

    if (dto.phone) {
      const existingMember = await this.prisma.familyMember.findFirst({
        where: {
          phone: dto.phone.trim(),
          familyId: { not: familyId },
        },
        include: { family: { select: { id: true, name: true } } },
      });

      if (existingMember) {
        throw new ConflictException({
          message: 'A member with this phone number already exists',
          duplicate: true,
          existingMember: {
            id: existingMember.id,
            displayId: existingMember.displayId,
            firstName: existingMember.firstName,
            lastName: existingMember.lastName,
            phone: existingMember.phone,
            family: existingMember.family,
          },
        });
      }
    }

    const displayId = await this.identityService.generateMemberId();

    const data: any = {
      displayId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      familyId,
    };

    if (dto.middleName) data.middleName = dto.middleName;
    if (dto.nickname) data.nickname = dto.nickname;
    if (dto.birthDate) data.birthDate = dto.birthDate;
    if (dto.deathDate) data.deathDate = dto.deathDate;
    if (dto.gender) data.gender = dto.gender;
    if (dto.bio) data.bio = dto.bio;
    if (dto.email) data.email = dto.email.toLowerCase().trim();
    if (dto.phone) data.phone = dto.phone.trim();
    if (dto.address) data.address = dto.address;
    if (dto.whatsapp) data.whatsapp = dto.whatsapp;
    if (dto.city) data.city = dto.city;
    if (dto.country) data.country = dto.country;
    if (dto.occupation) data.occupation = dto.occupation;
    if (dto.notes) data.notes = dto.notes;
    if (dto.governmentId) data.governmentId = dto.governmentId;

    const member = await this.prisma.familyMember.create({
      data,
    });

    this.notificationsEvent.emit({
      type: 'MEMBER_ADDED',
      title: 'Member Added',
      message: `${dto.firstName} ${dto.lastName} has been added to your family.`,
      userId,
      actionUrl: `/dashboard/families/${familyId}`,
      metadata: { memberId: member.id, memberName: `${dto.firstName} ${dto.lastName}` },
    }).catch(() => {});

    this.activityEvent.emitMemberAdded(userId, familyId, `${dto.firstName} ${dto.lastName}`).catch(() => {});

    if (dto.birthDate) {
      this.timelineService.create({
        familyId,
        memberId: member.id,
        eventType: 'BIRTH',
        title: `${dto.firstName} ${dto.lastName} was born`,
        description: `${dto.firstName} ${dto.lastName} joined the family.`,
        date: dto.birthDate,
        isAuto: true,
      }).catch(() => {});
    }

    return member;
  }

  async findAll(familyId: string, userId: string) {
    const family = await this.prisma.family.findUnique({ where: { id: familyId } });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this family');
    }

    return this.prisma.familyMember.findMany({
      where: { familyId },
      include: {
        fromRelationships: true,
        toRelationships: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(memberId: string, userId: string) {
    const member = await this.prisma.familyMember.findUnique({
      where: { id: memberId },
      include: {
        family: { select: { id: true, ownerId: true } },
        fromRelationships: true,
        toRelationships: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.family.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this member');
    }

    return member;
  }

  async update(memberId: string, userId: string, dto: UpdateMemberDto) {
    const member = await this.prisma.familyMember.findUnique({
      where: { id: memberId },
      include: { family: { select: { ownerId: true } } },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.family.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this member');
    }

    const data: any = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.middleName !== undefined) data.middleName = dto.middleName;
    if (dto.nickname !== undefined) data.nickname = dto.nickname;
    if (dto.birthDate !== undefined) data.birthDate = dto.birthDate;
    if (dto.deathDate !== undefined) data.deathDate = dto.deathDate;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.avatar !== undefined) data.avatar = dto.avatar;
    if (dto.email !== undefined) data.email = dto.email ? dto.email.toLowerCase().trim() : null;
    if (dto.phone !== undefined) data.phone = dto.phone ? dto.phone.trim() : null;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.whatsapp !== undefined) data.whatsapp = dto.whatsapp;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.occupation !== undefined) data.occupation = dto.occupation;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.governmentId !== undefined) data.governmentId = dto.governmentId;

    const updatedMember = await this.prisma.familyMember.update({
      where: { id: memberId },
      data,
      include: {
        fromRelationships: true,
        toRelationships: true,
      },
    });

    this.activityEvent.emitMemberUpdated(userId, member.familyId, `${member.firstName} ${member.lastName}`).catch(() => {});

    return updatedMember;
  }

  async remove(memberId: string, userId: string) {
    const member = await this.prisma.familyMember.findUnique({
      where: { id: memberId },
      include: { family: { select: { ownerId: true } } },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.family.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this member');
    }

    await this.prisma.familyMember.delete({ where: { id: memberId } });

    this.notificationsEvent.emit({
      type: 'MEMBER_DELETED',
      title: 'Member Removed',
      message: `${member.firstName} ${member.lastName} has been removed from your family.`,
      userId,
      metadata: { memberId, memberName: `${member.firstName} ${member.lastName}` },
    }).catch(() => {});

    this.activityEvent.emitMemberDeleted(userId, member.familyId, `${member.firstName} ${member.lastName}`).catch(() => {});

    return { message: 'Member removed successfully' };
  }

  async checkDuplicate(familyId: string, firstName: string, lastName: string, birthDate?: string) {
    const where: any = {
      familyId,
      firstName: { equals: firstName, mode: 'insensitive' },
      lastName: { equals: lastName, mode: 'insensitive' },
    };

    if (birthDate) {
      where.birthDate = new Date(birthDate);
    }

    const existing = await this.prisma.familyMember.findFirst({ where });

    return {
      duplicate: !!existing,
      member: existing || null,
    };
  }

  async checkGlobalDuplicate(dto: CreateMemberDto) {
    const results: any[] = [];

    if (dto.email) {
      const byEmail = await this.prisma.familyMember.findFirst({
        where: { email: dto.email.toLowerCase().trim() },
        include: { family: { select: { id: true, name: true, displayId: true } } },
      });
      if (byEmail) {
        results.push({
          field: 'email',
          message: 'Member with this email already exists',
          member: byEmail,
        });
      }
    }

    if (dto.phone) {
      const byPhone = await this.prisma.familyMember.findFirst({
        where: { phone: dto.phone.trim() },
        include: { family: { select: { id: true, name: true, displayId: true } } },
      });
      if (byPhone) {
        results.push({
          field: 'phone',
          message: 'Member with this phone number already exists',
          member: byPhone,
        });
      }
    }

    if (dto.governmentId) {
      const byGovId = await this.prisma.familyMember.findFirst({
        where: { governmentId: dto.governmentId.trim() },
        include: { family: { select: { id: true, name: true, displayId: true } } },
      });
      if (byGovId) {
        results.push({
          field: 'governmentId',
          message: 'Member with this government ID already exists',
          member: byGovId,
        });
      }
    }

    const byName = await this.prisma.familyMember.findFirst({
      where: {
        firstName: { equals: dto.firstName, mode: 'insensitive' },
        lastName: { equals: dto.lastName, mode: 'insensitive' },
      },
      include: { family: { select: { id: true, name: true, displayId: true } } },
    });

    if (byName) {
      results.push({
        field: 'name',
        message: 'A member with this name already exists',
        member: byName,
      });
    }

    return {
      hasDuplicates: results.length > 0,
      duplicates: results,
    };
  }

  async smartInviteSearch(familyId: string, query: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      return { users: [], members: [], total: 0 };
    }

    const existingFamilyMembers = await this.prisma.familyMember.findMany({
      where: { familyId },
      select: { id: true, email: true, phone: true },
    });

    const existingMemberEmails = new Set(
      existingFamilyMembers
        .map(m => m.email?.toLowerCase().trim())
        .filter(Boolean),
    );

    const existingMemberPhones = new Set(
      existingFamilyMembers
        .map(m => m.phone?.trim())
        .filter(Boolean),
    );

    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        accountStatus: 'active',
        OR: [
          { name: { contains: trimmedQuery, mode: 'insensitive' } },
          { displayName: { contains: trimmedQuery, mode: 'insensitive' } },
          { email: { contains: trimmedQuery, mode: 'insensitive' } },
          { phone: { contains: trimmedQuery, mode: 'insensitive' } },
          { firstName: { contains: trimmedQuery, mode: 'insensitive' } },
          { lastName: { contains: trimmedQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        displayId: true,
        name: true,
        displayName: true,
        email: true,
        phone: true,
        avatar: true,
        city: true,
        country: true,
      },
      take: 20,
    });

    const filteredUsers = users.filter(u => u.email && !existingMemberEmails.has(u.email.toLowerCase().trim()));

    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId: { not: familyId },
        OR: [
          { firstName: { contains: trimmedQuery, mode: 'insensitive' } },
          { lastName: { contains: trimmedQuery, mode: 'insensitive' } },
          { email: { contains: trimmedQuery, mode: 'insensitive' } },
          { phone: { contains: trimmedQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        displayId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        city: true,
        country: true,
        family: { select: { id: true, name: true, displayId: true } },
      },
      take: 20,
    });

    const filteredMembers = members.filter(m => {
      if (m.email && existingMemberEmails.has(m.email.toLowerCase().trim())) return false;
      if (m.phone && existingMemberPhones.has(m.phone.trim())) return false;
      return true;
    });

    return {
      users: filteredUsers,
      members: filteredMembers,
      total: filteredUsers.length + filteredMembers.length,
    };
  }
}
