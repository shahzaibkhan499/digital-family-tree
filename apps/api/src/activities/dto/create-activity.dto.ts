import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  familyId?: string;

  @IsString()
  @IsOptional()
  memberId?: string;

  @IsString()
  eventType: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  visibility?: string;

  @IsString()
  @IsOptional()
  entityType?: string;

  @IsString()
  @IsOptional()
  entityId?: string;

  @IsString()
  @IsOptional()
  entityName?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  createdBy?: string;
}

export class CreateCommentDto {
  @IsString()
  content: string;
}

export class CreateReactionDto {
  @IsString()
  @IsOptional()
  type?: string;
}
