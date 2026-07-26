import { IsString, IsOptional, IsIn } from 'class-validator';

const DOCUMENT_TYPES = ['RESEARCH', 'HISTORICAL_RECORD', 'FAMILY_RECORD', 'BOOK', 'CERTIFICATE'] as const;

export class CreateClanDocumentDto {
  @IsString()
  clanId: string;

  @IsString()
  @IsIn(DOCUMENT_TYPES)
  type: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}
