import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateVerificationDto {
  @IsString() documentId: string;
  @IsString() @IsOptional() verificationType?: string;
  @IsNumber() @IsOptional() confidence?: number;
  @IsString() @IsOptional() notes?: string;
  @IsString() @IsOptional() evidence?: string;
  @IsBoolean() @IsOptional() isOfficial?: boolean;
}
