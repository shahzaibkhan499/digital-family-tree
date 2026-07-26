import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateKnowledgeBaseDto {
  @IsString() title: string;
  @IsString() @IsOptional() content?: string;
  @IsString() @IsOptional() articleType?: string;
  @IsString() @IsOptional() collectionId?: string;
  @IsString() @IsOptional() galleryId?: string;
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() visibility?: string;
  @IsString() @IsOptional() tags?: string;
  @IsString() @IsOptional() familyId?: string;
  @IsString() @IsOptional() clanId?: string;
  @IsString() @IsOptional() communityId?: string;
}
