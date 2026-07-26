import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString, IsIn } from 'class-validator';

const EVENT_TYPES = ['MEETING', 'FESTIVAL', 'PROGRAM', 'REUNION', 'GATHERING', 'OTHER'] as const;

export class CreateClanEventDto {
  @IsString()
  clanId: string;

  @IsString()
  @IsIn(EVENT_TYPES)
  type: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @IsNumber()
  maxAttendees?: number;
}
