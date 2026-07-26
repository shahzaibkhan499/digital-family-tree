import { IsString, IsOptional, IsIn, IsBoolean, IsInt, IsDateString } from 'class-validator';

export class CreateShareDto {
  @IsString()
  documentId: string;

  @IsString()
  @IsOptional()
  sharedWithId?: string;

  @IsIn(['USER', 'LINK', 'FAMILY', 'CLAN', 'COMMUNITY'])
  @IsOptional()
  shareType?: string;

  @IsIn(['VIEW', 'DOWNLOAD', 'EDIT'])
  @IsOptional()
  permission?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsBoolean()
  @IsOptional()
  isDownloadAllowed?: boolean;

  @IsInt()
  @IsOptional()
  maxDownloads?: number;
}
