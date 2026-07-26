import { IsString } from 'class-validator';

export class CreateCommunityDirectoryDto {
  @IsString()
  communityId: string;
}
