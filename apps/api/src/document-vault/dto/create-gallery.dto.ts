import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateGalleryDto {
  @IsString() title: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() galleryType?: string;
  @IsString() @IsOptional() albumName?: string;
  @IsString() @IsOptional() coverImage?: string;
  @IsString() @IsOptional() visibility?: string;
  @IsString() @IsOptional() familyId?: string;
  @IsString() @IsOptional() clanId?: string;
  @IsString() @IsOptional() communityId?: string;
  @IsString() @IsOptional() subClanId?: string;
  @IsString() @IsOptional() historicalDate?: string;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() photographer?: string;
  @IsString() @IsOptional() tags?: string;
}
