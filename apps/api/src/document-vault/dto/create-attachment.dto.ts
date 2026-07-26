import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAttachmentDto {
  @IsString() documentId: string;
  @IsString() entityType: string;
  @IsString() entityId: string;
  @IsString() @IsOptional() attachmentType?: string;
  @IsString() @IsOptional() description?: string;
  @IsBoolean() @IsOptional() isPrimary?: boolean;
}
