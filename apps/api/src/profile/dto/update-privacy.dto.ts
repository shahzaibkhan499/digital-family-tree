import { IsOptional, IsString } from 'class-validator';

export class UpdatePrivacyDto {
  @IsOptional()
  @IsString()
  profileVisibility?: string;

  @IsOptional()
  @IsString()
  emailVisibility?: string;
}
