import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { UpdateFieldPrivacyDto } from './dto/update-field-privacy.dto';
import { ClaimUsernameDto } from './dto/claim-username.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { IdentityService } from '../common/identity.service';
import { UploadService } from '../upload/upload.service';
import { ActivityEventService } from '../activities/activity-event.service';

const USER_SELECT = {
  id: true,
  displayId: true,
  email: true,
  name: true,
  role: true,
  plan: true,
  createdAt: true,
  updatedAt: true,
  username: true,
  profileSlug: true,
  emailVerified: true,
  accountStatus: true,
  lastLoginAt: true,
  firstName: true,
  middleName: true,
  lastName: true,
  displayName: true,
  nickname: true,
  gender: true,
  dateOfBirth: true,
  placeOfBirth: true,
  bloodGroup: true,
  maritalStatus: true,
  nationality: true,
  religion: true,
  languages: true,
  phone: true,
  whatsapp: true,
  alternativePhone: true,
  country: true,
  province: true,
  city: true,
  postalCode: true,
  fullAddress: true,
  bio: true,
  occupation: true,
  company: true,
  education: true,
  skills: true,
  interests: true,
  website: true,
  socialLinks: true,
  fatherId: true,
  motherId: true,
  spouseId: true,
  childrenIds: true,
  siblingIds: true,
  avatar: true,
  coverPhoto: true,
  privacySettings: true,
  locale: true,
  timezone: true,
  twoFactorEnabled: true,
} as const;

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private uploadService: UploadService,
    private activityEvent: ActivityEventService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const familyCount = await this.prisma.family.count({ where: { ownerId: userId } });

    const families = await this.prisma.family.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const familyIds = families.map((f) => f.id);

    const memberCount = await this.prisma.familyMember.count({
      where: { familyId: { in: familyIds } },
    });

    return {
      ...user,
      familyCount,
      memberCount,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto as any,
      select: USER_SELECT,
    });
  }

  async updatePrivacy(userId: string, dto: UpdatePrivacyDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let settings: string;
    if (dto.profileVisibility || dto.emailVisibility) {
      settings = JSON.stringify({
        profileVisibility: dto.profileVisibility,
        emailVisibility: dto.emailVisibility,
      });
    } else {
      settings = user.privacySettings || '{}';
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { privacySettings: settings },
      select: {
        id: true,
        privacySettings: true,
      },
    });
  }

  async getProfileCompletion(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const requiredFields = [
      { key: 'firstName', label: 'firstName' },
      { key: 'lastName', label: 'lastName' },
      { key: 'gender', label: 'gender' },
      { key: 'dateOfBirth', label: 'dateOfBirth' },
      { key: 'phone', label: 'phone' },
      { key: 'bio', label: 'bio' },
      { key: 'occupation', label: 'occupation' },
      { key: 'country', label: 'country' },
      { key: 'city', label: 'city' },
    ];

    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const value = user[field.key as keyof typeof user];
      if (!value) {
        missingFields.push(field.label);
      }
    }

    const percentage = Math.round(
      ((requiredFields.length - missingFields.length) / requiredFields.length) * 100,
    );

    return { percentage, missingFields };
  }

  async getLoginSessions(userId: string) {
    return this.prisma.loginSession.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 20,
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const buffer = this.uploadService.validateAndPrepare(file);

    await this.uploadService.deleteImage(user.avatar);

    const result = await this.uploadService.uploadAvatar(buffer, userId);

    this.activityEvent.emitAvatarChanged(userId).catch(() => {});

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: result.secureUrl },
      select: { id: true, avatar: true },
    });
  }

  async uploadCoverPhoto(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const buffer = this.uploadService.validateAndPrepare(file);

    await this.uploadService.deleteImage(user.coverPhoto);

    const result = await this.uploadService.uploadCover(buffer, userId);

    this.activityEvent.emitCoverChanged(userId).catch(() => {});

    return this.prisma.user.update({
      where: { id: userId },
      data: { coverPhoto: result.secureUrl },
      select: { id: true, coverPhoto: true },
    });
  }

  async removeAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.uploadService.deleteImage(user.avatar);

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: { id: true, avatar: true },
    });
  }

  async removeCoverPhoto(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.uploadService.deleteImage(user.coverPhoto);

    return this.prisma.user.update({
      where: { id: userId },
      data: { coverPhoto: null },
      select: { id: true, coverPhoto: true },
    });
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.uploadService.deleteImage(user.avatar);
    await this.uploadService.deleteImage(user.coverPhoto);

    await this.prisma.user.delete({ where: { id: userId } });

    return { message: 'Account deleted successfully' };
  }

  async claimUsername(userId: string, dto: ClaimUsernameDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.username) {
      throw new BadRequestException('Username already claimed. Contact support to change it.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const slug = dto.username.toLowerCase().replace(/[^a-z0-9_-]/g, '');

    this.activityEvent
      .emitSecurityEvent(
        userId,
        'USERNAME_CHANGED',
        'Username claimed',
        `Username set to ${dto.username}.`,
      )
      .catch(() => {});

    return this.prisma.user.update({
      where: { id: userId },
      data: { username: dto.username, profileSlug: slug },
      select: {
        id: true,
        username: true,
        profileSlug: true,
      },
    });
  }

  async getPublicProfile(slug: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ profileSlug: slug }, { username: slug }],
        accountStatus: 'active',
        deletedAt: null,
      },
      select: {
        id: true,
        displayId: true,
        name: true,
        profileSlug: true,
        username: true,
        avatar: true,
        bio: true,
        occupation: true,
        company: true,
        city: true,
        country: true,
        createdAt: true,
        privacySettings: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    let privacy: Record<string, string> = {};
    if (user.privacySettings) {
      try {
        privacy = JSON.parse(user.privacySettings);
      } catch {
        /* ignore parse error */
      }
    }

    const isPublic = privacy.profileVisibility !== 'private';
    if (!isPublic) {
      throw new NotFoundException('Profile not found');
    }

    const { privacySettings: _, ...publicProfile } = user;
    return publicProfile;
  }

  async getPublicProfileByDisplayId(displayId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        displayId,
        accountStatus: 'active',
        deletedAt: null,
      },
      select: {
        id: true,
        displayId: true,
        name: true,
        profileSlug: true,
        username: true,
        avatar: true,
        bio: true,
        occupation: true,
        company: true,
        city: true,
        country: true,
        createdAt: true,
        privacySettings: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    let privacy: Record<string, string> = {};
    if (user.privacySettings) {
      try {
        privacy = JSON.parse(user.privacySettings);
      } catch {
        /* ignore parse error */
      }
    }

    const isPublic = privacy.profileVisibility !== 'private';
    if (!isPublic) {
      throw new NotFoundException('Profile not found');
    }

    const { privacySettings: _, ...publicProfile } = user;
    return publicProfile;
  }

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        locale: true,
        timezone: true,
        emailVerified: true,
        twoFactorEnabled: true,
        accountStatus: true,
        privacySettings: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        locale: true,
        timezone: true,
        theme: true,
      },
    });
  }

  async getFieldPrivacy(userId: string) {
    const settings = await this.prisma.profileFieldPrivacy.findMany({
      where: { userId },
    });
    return settings;
  }

  async updateFieldPrivacy(userId: string, dto: UpdateFieldPrivacyDto) {
    const results = [];
    for (const field of dto.fields) {
      const setting = await this.prisma.profileFieldPrivacy.upsert({
        where: { userId_fieldName: { userId, fieldName: field.fieldName } },
        update: { visibility: field.visibility },
        create: { userId, fieldName: field.fieldName, visibility: field.visibility },
      });
      results.push(setting);
    }
    return results;
  }

  async getProfileWithPrivacy(userId: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');

    if (!viewerId || viewerId === userId) return user;

    const privacySettings = await this.prisma.profileFieldPrivacy.findMany({
      where: { userId },
    });

    const privacyMap: Record<string, string> = {};
    privacySettings.forEach((p) => {
      privacyMap[p.fieldName] = p.visibility;
    });

    return this.applyPrivacyFilter(user, privacyMap, viewerId);
  }

  private async applyPrivacyFilter(
    user: any,
    privacyMap: Record<string, string>,
    viewerId: string,
  ) {
    const filtered = { ...user };

    const ALWAYS_VISIBLE = ['id', 'displayId', 'name', 'avatar', 'createdAt'];

    for (const [fieldName, visibility] of Object.entries(privacyMap)) {
      if (ALWAYS_VISIBLE.includes(fieldName)) continue;

      let canView = false;
      switch (visibility) {
        case 'PUBLIC':
          canView = true;
          break;
        case 'ONLY_ME':
          canView = false;
          break;
        case 'FAMILY': {
          const viewerFamilies = await this.getMembershipFamilyIds(viewerId);
          const ownerFamilies = await this.prisma.family.findMany({
            where: { ownerId: user.id },
            select: { id: true },
          });
          canView = viewerFamilies.some((f) => ownerFamilies.some((of) => of.id === f));
          break;
        }
        case 'SUB_CLAN': {
          const viewerSubClans = await this.getVisibleSubClanIds(viewerId);
          const ownerSubClans = await this.getVisibleSubClanIds(user.id);
          canView = viewerSubClans.some((s) => ownerSubClans.includes(s));
          break;
        }
        case 'CLAN': {
          const viewerClans = await this.getVisibleClanIds(viewerId);
          const ownerClans = await this.getVisibleClanIds(user.id);
          canView = viewerClans.some((c) => ownerClans.includes(c));
          break;
        }
        case 'COMMUNITY': {
          const viewerComms = await this.getVisibleCommunityIds(viewerId);
          const ownerComms = await this.getVisibleCommunityIds(user.id);
          canView = viewerComms.some((c) => ownerComms.includes(c));
          break;
        }
        default:
          canView = visibility === 'PUBLIC';
      }

      if (!canView) filtered[fieldName] = null;
    }

    return filtered;
  }

  private async getMembershipFamilyIds(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const families = await this.prisma.family.findMany({
      where: {
        OR: [
          { ownerId: userId },
          ...(user?.email
            ? [
                {
                  members: {
                    some: { email: { equals: user.email, mode: 'insensitive' as const } },
                  },
                },
              ]
            : []),
        ],
      },
      select: { id: true },
    });
    return families.map((f) => f.id);
  }

  private async getVisibleSubClanIds(userId: string): Promise<string[]> {
    const families = await this.prisma.family.findMany({
      where: { id: { in: await this.getMembershipFamilyIds(userId) } },
      select: { subClanId: true },
    });
    return [...new Set(families.map((f) => f.subClanId).filter(Boolean))] as string[];
  }

  private async getVisibleClanIds(userId: string): Promise<string[]> {
    const families = await this.prisma.family.findMany({
      where: { id: { in: await this.getMembershipFamilyIds(userId) } },
      select: { clanId: true },
    });
    return [...new Set(families.map((f) => f.clanId).filter(Boolean))] as string[];
  }

  private async getVisibleCommunityIds(userId: string): Promise<string[]> {
    const families = await this.prisma.family.findMany({
      where: { id: { in: await this.getMembershipFamilyIds(userId) } },
      select: { clanId: true },
    });
    const clanIds = [...new Set(families.map((f) => f.clanId).filter(Boolean))] as string[];
    if (clanIds.length === 0) return [];
    const clans = await this.prisma.clan.findMany({
      where: { id: { in: clanIds } },
      select: { communityId: true },
    });
    return [...new Set(clans.map((c) => c.communityId).filter(Boolean))] as string[];
  }
}
