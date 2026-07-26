import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

const HISTORY_TYPES = ['ORIGIN', 'MIGRATION', 'LEADER', 'EVENT', 'MAP', 'REFERENCE', 'SOURCE'] as const;

export class CreateCommunityHistoryDto {
  @IsString()
  communityId: string;

  @IsString()
  @IsIn(HISTORY_TYPES)
  type: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
