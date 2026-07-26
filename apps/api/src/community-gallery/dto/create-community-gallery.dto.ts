import { IsString, IsOptional, IsIn } from 'class-validator';

const GALLERY_TYPES = ['PHOTO', 'VIDEO', 'DOCUMENT', 'MAP', 'HISTORICAL_IMAGE'] as const;

export class CreateCommunityGalleryDto {
  @IsString()
  communityId: string;

  @IsString()
  @IsIn(GALLERY_TYPES)
  type: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
