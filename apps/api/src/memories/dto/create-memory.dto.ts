import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';

export class CreateMemoryDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  story?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  visibility?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  familyId: string;

  @IsString()
  @IsOptional()
  subClanId?: string;

  @IsString()
  @IsOptional()
  clanId?: string;

  @IsString()
  @IsOptional()
  communityId?: string;

  @IsArray()
  @IsOptional()
  memberIds?: string[];

  @IsArray()
  @IsOptional()
  media?: { url: string; type?: string; alt?: string }[];
}

export class UpdateMemoryDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  story?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  visibility?: string;

  @IsString()
  @IsOptional()
  tags?: string;
}

export class CreateMemoryCommentDto {
  @IsString()
  content: string;
}

export class CreateMemoryReactionDto {
  @IsString()
  @IsOptional()
  type?: string;
}
