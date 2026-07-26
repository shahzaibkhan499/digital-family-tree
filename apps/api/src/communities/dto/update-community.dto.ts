import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateCommunityDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  history?: string;

  @IsString()
  @IsOptional()
  origin?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  banner?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  founder?: string;

  @IsString()
  @IsOptional()
  privacy?: string;

  @IsOptional()
  @IsString()
  foundedDate?: string;

  @IsOptional()
  @IsString()
  languages?: string;

  @IsOptional()
  @IsString()
  countries?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  seoMetadata?: any;
}
