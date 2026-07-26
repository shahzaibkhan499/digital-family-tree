import { IsString, IsOptional, IsIn, IsBoolean, IsInt, IsDateString } from 'class-validator';

const VISIBILITY_LEVELS = ['ONLY_ME', 'FAMILY', 'SUBCLAN', 'CLAN', 'COMMUNITY', 'PUBLIC', 'CUSTOM'] as const;
const VERIFICATION_STATUSES = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'] as const;

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsString()
  @IsOptional()
  folderId?: string;

  @IsString()
  @IsOptional()
  storageUrl?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsString()
  @IsOptional()
  extension?: string;

  @IsInt()
  @IsOptional()
  fileSize?: number;

  @IsInt()
  @IsOptional()
  pages?: number;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsDateString()
  @IsOptional()
  historicalDate?: string;

  @IsDateString()
  @IsOptional()
  documentDate?: string;

  @IsIn(VISIBILITY_LEVELS)
  @IsOptional()
  visibility?: string;

  @IsIn(VERIFICATION_STATUSES)
  @IsOptional()
  verificationStatus?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  keywords?: string;

  @IsString()
  @IsOptional()
  references?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;
}
