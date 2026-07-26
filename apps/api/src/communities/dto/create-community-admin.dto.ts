import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateCommunityAdminDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsEnum(['ADMIN', 'MODERATOR'])
  role?: string;
}
