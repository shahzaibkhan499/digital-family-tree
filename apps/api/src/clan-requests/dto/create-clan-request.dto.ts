import { IsString, IsOptional } from 'class-validator';

export class CreateClanRequestDto {
  @IsString()
  familyId: string;

  @IsString()
  @IsOptional()
  message?: string;
}
