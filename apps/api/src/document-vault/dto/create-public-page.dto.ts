import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreatePublicPageDto {
  @IsString() documentId: string;
  @IsString() slug: string;
  @IsString() title: string;
  @IsString() @IsOptional() metaTitle?: string;
  @IsString() @IsOptional() metaDescription?: string;
  @IsString() @IsOptional() ogImage?: string;
  @IsBoolean() @IsOptional() isPublished?: boolean;
  @IsBoolean() @IsOptional() allowDownload?: boolean;
  @IsBoolean() @IsOptional() allowComments?: boolean;
  @IsString() @IsOptional() template?: string;
}
