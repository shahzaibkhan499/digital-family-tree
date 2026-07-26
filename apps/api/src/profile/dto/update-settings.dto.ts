import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  @IsIn(['en', 'es', 'fr', 'de', 'pt', 'ar', 'ur', 'zh', 'ja', 'ko', 'hi'])
  locale?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  @IsIn(['light', 'dark', 'system'])
  theme?: string;
}
