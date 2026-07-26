import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import { NotificationsEventService } from '../notifications/notifications-event.service';
import { ActivityEventService } from '../activities/activity-event.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

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

    const hashedPassword = await bcrypt.hash(dto.password, 10);
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
      data: { refreshToken: await bcrypt.hash(refresh_token, 10) },
    });

    this.notificationsEvent.emit({
      type: 'WELCOME',
      title: 'Welcome to Digital Family Tree!',
      message: `Hello ${dto.name}, welcome to the platform. Start building your family tree today.`,
      userId: user.id,
      priority: 'HIGH',
    }).catch(() => {});

    this.activityEvent.emitUserRegistered(user.id, dto.name).catch(() => {});

    return {
      user,
      access_token,
      refresh_token,
    };
  }

  async login(dto: LoginDto) {
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
      const lockUntil = newFailedAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MS)
        : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: newFailedAttempts, lockedUntil: lockUntil },
      });

      if (lockUntil) {
        throw new UnauthorizedException(`Account locked due to too many failed attempts. Try again in 15 minutes.`);
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
        refreshToken: await bcrypt.hash(refresh_token, 10),
        lastLoginAt: new Date(),
      },
    });

    this.notificationsEvent.emit({
      type: 'LOGIN_ALERT',
      title: 'New Login Detected',
      message: 'A new login to your account was detected.',
      userId: user.id,
      priority: 'LOW',
    }).catch(() => {});

    this.activityEvent.emitSecurityEvent(user.id, 'LOGIN_ALERT', 'Logged in', 'New login detected.').catch(() => {});

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
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newAccessToken = this.generateAccessToken(user.id, user.email, user.role);
      const newRefreshToken = this.generateRefreshToken(user.id, user.email, user.role);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: await bcrypt.hash(newRefreshToken, 10) },
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
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: (process.env.JWT_REFRESH_EXPIRATION || '30d') as any,
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If an account exists with that email, a reset link has been sent.' };
    }
    this.jwtService.sign(
      { sub: user.id, email: user.email, purpose: 'reset' },
      { expiresIn: '1h' },
    );
    return { message: 'If an account exists with that email, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      if (payload.purpose !== 'reset') {
        throw new BadRequestException('Invalid reset token');
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { password: hashedPassword, refreshToken: null },
      });

      this.notificationsEvent.emit({
        type: 'PASSWORD_CHANGED',
        title: 'Password Changed',
        message: 'Your password has been changed successfully.',
        userId: payload.sub,
        priority: 'HIGH',
      }).catch(() => {});

      this.activityEvent.emitSecurityEvent(payload.sub, 'PASSWORD_CHANGED', 'Password changed', 'Password was reset successfully.').catch(() => {});

      return { message: 'Password reset successfully' };
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

}
