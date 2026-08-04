import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => req?.cookies?.access_token || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
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
        lockedUntil: true,
        failedLoginAttempts: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.accountStatus !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    return user;
  }
}
