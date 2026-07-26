import { IsString, IsOptional, IsDateString, IsBoolean, IsArray, IsEnum, ValidateNested, IsNumber, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventMediaDto {
  @IsString()
  url: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;
}

export class CreateTimelineEventDto {
  @IsString()
  familyId: string;

  @IsString()
  @IsOptional()
  memberId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  eventType: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  subtitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  venue?: string;

  @IsString()
  @IsOptional()
  mapLink?: string;

  @IsOptional()
  coordinates?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  createdById?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isAuto?: boolean;

  @IsString()
  @IsOptional()
  visibility?: string;

  @IsString()
  @IsOptional()
  subClanId?: string;

  @IsString()
  @IsOptional()
  clanId?: string;

  @IsString()
  @IsOptional()
  communityId?: string;

  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @IsBoolean()
  @IsOptional()
  pinned?: boolean;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  notificationChannels?: string[];

  @IsBoolean()
  @IsOptional()
  hideFromPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  restrictScreenshots?: boolean;

  @IsString()
  @IsOptional()
  recurrence?: string;

  @IsString()
  @IsOptional()
  recurrenceRule?: string;

  @IsString()
  @IsOptional()
  seriesId?: string;

  @IsString()
  @IsOptional()
  parentEventId?: string;

  @IsNumber()
  @IsOptional()
  maxAttendees?: number;

  @IsDateString()
  @IsOptional()
  rsvpDeadline?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  participantIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventMediaDto)
  @IsOptional()
  media?: CreateEventMediaDto[];
}

export class UpdateTimelineEventDto {
  @IsString()
  @IsOptional()
  familyId?: string;

  @IsString()
  @IsOptional()
  memberId?: string;

  @IsString()
  @IsOptional()
  eventType?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  venue?: string;

  @IsString()
  @IsOptional()
  mapLink?: string;

  @IsOptional()
  coordinates?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isAuto?: boolean;

  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @IsBoolean()
  @IsOptional()
  pinned?: boolean;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsBoolean()
  @IsOptional()
  archived?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  notificationChannels?: string[];

  @IsBoolean()
  @IsOptional()
  hideFromPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  restrictScreenshots?: boolean;

  @IsString()
  @IsOptional()
  cancellationReason?: string;

  @IsString()
  @IsOptional()
  recurrence?: string;

  @IsString()
  @IsOptional()
  recurrenceRule?: string;

  @IsNumber()
  @IsOptional()
  maxAttendees?: number;

  @IsDateString()
  @IsOptional()
  rsvpDeadline?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  addParticipantIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  removeParticipantIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventMediaDto)
  @IsOptional()
  media?: CreateEventMediaDto[];
}

export class RsvpDto {
  @IsString()
  @IsOptional()
  eventId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  rsvpStatus: string;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}

export class CreateReactionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  emoji: string;
}

export class CreateEventDocumentDto {
  @IsString()
  fileName: string;

  @IsString()
  fileType: string;

  @IsString()
  fileUrl: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  ownerId?: string;

  @IsString()
  @IsOptional()
  privacy?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class CreateEventNotificationDto {
  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  audience?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[];

  @IsString()
  @IsOptional()
  deliveryChannel?: string;
}

export class CreateEventReminderDto {
  @IsString()
  @IsOptional()
  reminderType?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  channel?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  deliveryChannel?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  recurrenceRule?: string;
}
