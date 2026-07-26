import { IsString, IsOptional } from 'class-validator';

export class CreateCommunityRequestDto {
  @IsString()
  communityId: string;

  @IsString()
  familyId: string;

  @IsOptional()
  @IsString()
  message?: string;
}
