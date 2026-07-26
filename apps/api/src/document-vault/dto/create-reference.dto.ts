import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateReferenceDto {
  @IsString() @IsOptional() documentId?: string;
  @IsString() @IsOptional() galleryId?: string;
  @IsString() @IsOptional() referenceType?: string;
  @IsString() title: string;
  @IsString() @IsOptional() author?: string;
  @IsString() @IsOptional() publishDate?: string;
  @IsString() @IsOptional() publisher?: string;
  @IsString() @IsOptional() url?: string;
  @IsString() @IsOptional() isbn?: string;
  @IsString() @IsOptional() doi?: string;
  @IsString() @IsOptional() journalName?: string;
  @IsString() @IsOptional() volume?: string;
  @IsString() @IsOptional() issue?: string;
  @IsString() @IsOptional() pages?: string;
  @IsString() @IsOptional() accessDate?: string;
  @IsString() @IsOptional() reliability?: string;
  @IsString() @IsOptional() notes?: string;
}
