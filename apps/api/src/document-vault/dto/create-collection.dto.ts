import { IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class CreateCollectionDto {
  @IsString() name: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() collectionType?: string;
  @IsString() @IsOptional() visibility?: string;
  @IsString() @IsOptional() coverImage?: string;
  @IsBoolean() @IsOptional() isFeatured?: boolean;
  @IsNumber() @IsOptional() sortOrder?: number;
  @IsString() @IsOptional() familyId?: string;
  @IsString() @IsOptional() clanId?: string;
  @IsString() @IsOptional() communityId?: string;
  @IsString() @IsOptional() subClanId?: string;
}
