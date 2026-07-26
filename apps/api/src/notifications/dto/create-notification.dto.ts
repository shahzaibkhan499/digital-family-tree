import { IsString, IsOptional, IsBoolean, IsDateString, IsEnum, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  type: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class BroadcastNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  type: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  target?: string;

  @IsString()
  @IsOptional()
  targetId?: string;
}

export class UpdatePreferencesDto {
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  inAppNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  birthdayReminders?: boolean;

  @IsBoolean()
  @IsOptional()
  anniversaryReminders?: boolean;

  @IsBoolean()
  @IsOptional()
  invitationNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  familyUpdates?: boolean;

  @IsBoolean()
  @IsOptional()
  securityAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  adminAnnouncements?: boolean;

  @IsBoolean()
  @IsOptional()
  marketingEmails?: boolean;
}
