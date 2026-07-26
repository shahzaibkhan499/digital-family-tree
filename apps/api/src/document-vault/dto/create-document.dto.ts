import { IsString, IsOptional, IsIn, IsBoolean, IsInt, IsArray, IsDateString, IsNotEmpty } from 'class-validator';

const DOCUMENT_TYPES = [
  'PERSONAL', 'FAMILY', 'CLAN', 'COMMUNITY', 'HISTORICAL',
  'GENEALOGY_RECORDS', 'CERTIFICATE', 'BIRTH_CERTIFICATE',
  'DEATH_CERTIFICATE', 'MARRIAGE_CERTIFICATE', 'EDUCATION',
  'EMPLOYMENT', 'MILITARY', 'PROPERTY', 'RESEARCH_PAPERS',
  'BOOKS', 'PHOTOS', 'LETTERS', 'AUDIO', 'VIDEO',
  'SCANNED_DOCUMENTS', 'OLD_MANUSCRIPTS', 'MAPS',
  'LEGAL_DOCUMENTS', 'OTHER',
] as const;

const VISIBILITY_LEVELS = ['ONLY_ME', 'FAMILY', 'SUBCLAN', 'CLAN', 'COMMUNITY', 'PUBLIC', 'CUSTOM'] as const;
const OWNER_TYPES = ['USER', 'FAMILY', 'CLAN', 'COMMUNITY', 'SUBCLAN'] as const;

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(DOCUMENT_TYPES)
  @IsOptional()
  documentType?: string;

  @IsString()
  @IsOptional()
  ownerType?: string;

  @IsString()
  @IsOptional()
  familyId?: string;

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
  folderId?: string;

  @IsString()
  @IsOptional()
  originalFileName?: string;

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

  @IsString()
  @IsOptional()
  storageProvider?: string;
}
