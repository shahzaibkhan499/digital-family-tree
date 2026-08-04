import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { NotificationsEventService } from '../notifications/notifications-event.service';
import { ActivityEventService } from '../activities/activity-event.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private identityService: IdentityService,
    private notificationsEvent: NotificationsEventService,
    private activityEvent: ActivityEventService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const displayId = await this.identityService.generateUserId();
    const profileSlug = await this.identityService.generateProfileSlug(dto.name);

    const user = await this.prisma.user.create({
      data: {
        displayId,
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        profileSlug,
        ...(dto.gender ? { gender: dto.gender as any } : {}),
      },
      select: {
        id: true,
        displayId: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        plan: true,
        profileSlug: true,
        createdAt: true,
      },
    });

    const access_token = this.generateAccessToken(user.id, user.email, user.role);
    const refresh_token = this.generateRefreshToken(user.id, user.email, user.role);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: await bcrypt.hash(refresh_token, BCRYPT_ROUNDS) },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'USER',
        entityId: user.id,
        action: 'REGISTER',
        performedById: user.id,
      },
    });

    this.notificationsEvent
      .emit({
        type: 'WELCOME',
        title: 'Welcome to Digital Family Tree!',
        message: `Hello ${dto.name}, welcome to the platform. Start building your family tree today.`,
        userId: user.id,
        priority: 'HIGH',
      })
      .catch(() => {});

    this.activityEvent.emitUserRegistered(user.id, dto.name).catch(() => {});

    return {
      user,
      access_token,
      refresh_token,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Account locked. Try again in ${minutesLeft} minutes.`);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
      const lockUntil =
        newFailedAttempts >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCKOUT_DURATION_MS)
          : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: newFailedAttempts, lockedUntil: lockUntil },
      });

      await this.prisma.auditLog.create({
        data: {
          entityType: 'USER',
          entityId: user.id,
          action: 'LOGIN_FAILED',
          performedById: user.id,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });

      if (lockUntil) {
        await this.prisma.auditLog.create({
          data: {
            entityType: 'USER',
            entityId: user.id,
            action: 'ACCOUNT_LOCKED',
            performedById: user.id,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
          },
        });
        throw new UnauthorizedException(
          `Account locked due to too many failed attempts. Try again in 15 minutes.`,
        );
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    const access_token = this.generateAccessToken(user.id, user.email, user.role);
    const refresh_token = this.generateRefreshToken(user.id, user.email, user.role);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await bcrypt.hash(refresh_token, BCRYPT_ROUNDS),
        lastLoginAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'USER',
        entityId: user.id,
        action: 'LOGIN_SUCCESS',
        performedById: user.id,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    this.notificationsEvent
      .emit({
        type: 'LOGIN_ALERT',
        title: 'New Login Detected',
        message: 'A new login to your account was detected.',
        userId: user.id,
        priority: 'LOW',
      })
      .catch(() => {});

    this.activityEvent
      .emitSecurityEvent(user.id, 'LOGIN_ALERT', 'Logged in', 'New login detected.')
      .catch(() => {});

    return {
      user: {
        id: user.id,
        displayId: user.displayId,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        plan: user.plan,
        profileSlug: user.profileSlug,
        createdAt: user.createdAt,
      },
      access_token,
      refresh_token,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, refreshToken: true },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!isRefreshTokenValid) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: null },
        });
        await this.prisma.auditLog.create({
          data: {
            entityType: 'USER',
            entityId: user.id,
            action: 'TOKEN_REUSE_DETECTED',
            performedById: user.id,
          },
        });
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newAccessToken = this.generateAccessToken(user.id, user.email, user.role);
      const newRefreshToken = this.generateRefreshToken(user.id, user.email, user.role);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: await bcrypt.hash(newRefreshToken, BCRYPT_ROUNDS) },
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'USER',
        entityId: userId,
        action: 'LOGOUT',
        performedById: userId,
      },
    });

    return { message: 'Logged out successfully' };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private generateAccessToken(userId: string, email: string, role: string): string {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign(
      { sub: userId, email, role },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: (process.env.JWT_REFRESH_EXPIRATION || '7d') as any,
      },
    );
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If an account exists with that email, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash: tokenHash, resetTokenExpiresAt: expiresAt },
    });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:4001'}/reset-password?token=${token}`;
    this.notificationsEvent
      .emit({
        type: 'PASSWORD_CHANGED',
        title: 'Password Reset Requested',
        message:
          'A password reset was requested for your account. Use the link to set a new password. This link expires in 15 minutes.',
        actionUrl: resetLink,
        userId: user.id,
        priority: 'HIGH',
      })
      .catch(() => {});

    return { message: 'If an account exists with that email, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || typeof token !== 'string' || token.length < 20) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        refreshToken: null,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'USER',
        entityId: user.id,
        action: 'PASSWORD_RESET',
        performedById: user.id,
      },
    });

    this.notificationsEvent
      .emit({
        type: 'PASSWORD_CHANGED',
        title: 'Password Changed',
        message: 'Your password has been changed successfully.',
        userId: user.id,
        priority: 'HIGH',
      })
      .catch(() => {});

    this.activityEvent
      .emitSecurityEvent(
        user.id,
        'PASSWORD_CHANGED',
        'Password changed',
        'Password was reset successfully.',
      )
      .catch(() => {});

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const access_token = this.generateAccessToken(user.id, user.email, user.role);
    const refresh_token = this.generateRefreshToken(user.id, user.email, user.role);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        refreshToken: await bcrypt.hash(refresh_token, BCRYPT_ROUNDS),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'USER',
        entityId: userId,
        action: 'PASSWORD_CHANGE',
        performedById: userId,
      },
    });

    this.notificationsEvent
      .emit({
        type: 'PASSWORD_CHANGED',
        title: 'Password Changed',
        message: 'Your password has been changed successfully.',
        userId,
        priority: 'HIGH',
      })
      .catch(() => {});

    this.activityEvent
      .emitSecurityEvent(userId, 'PASSWORD_CHANGED', 'Password changed', 'Password was changed.')
      .catch(() => {});

    return { access_token, refresh_token };
  }
}
