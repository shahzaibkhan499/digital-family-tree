import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateEventInvitationDto {
  @IsString()
  eventId: string;

  @IsArray()
  @IsOptional()
  userIds?: string[];

  @IsArray()
  @IsOptional()
  familyIds?: string[];

  @IsString()
  @IsOptional()
  subClanId?: string;

  @IsString()
  @IsOptional()
  clanId?: string;

  @IsString()
  @IsOptional()
  communityId?: string;

  @IsString()
  @IsOptional()
  scope?: string;

  @IsString()
  @IsOptional()
  message?: string;
}
