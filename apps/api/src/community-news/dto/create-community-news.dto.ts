import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

const NEWS_TYPES = ['ANNOUNCEMENT', 'STORY', 'UPDATE'] as const;

export class CreateCommunityNewsDto {
  @IsString()
  communityId: string;

  @IsString()
  @IsIn(NEWS_TYPES)
  type: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
