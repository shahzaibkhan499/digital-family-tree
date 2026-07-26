import { IsString, IsEmail, IsOptional, IsDateString } from 'class-validator';

export class CreateInvitationDto {
  @IsString()
  familyId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
