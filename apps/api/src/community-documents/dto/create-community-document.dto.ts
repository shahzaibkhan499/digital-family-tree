import { IsString, IsOptional, IsIn } from 'class-validator';

const DOCUMENT_TYPES = ['BOOK', 'RESEARCH', 'CONSTITUTION', 'CERTIFICATE', 'HISTORICAL_RECORD'] as const;

export class CreateCommunityDocumentDto {
  @IsString()
  communityId: string;

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
