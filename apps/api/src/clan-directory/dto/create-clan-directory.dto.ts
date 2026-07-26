import { IsString } from 'class-validator';

export class CreateClanDirectoryDto {
  @IsString()
  clanId: string;
}
