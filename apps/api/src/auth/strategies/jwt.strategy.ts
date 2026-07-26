import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
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
        password: false,
        refreshToken: false,
        twoFactorSecret: false,
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
