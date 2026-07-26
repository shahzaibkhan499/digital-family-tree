import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  clanId?: string;

  @IsString()
  @IsOptional()
  subClanId?: string;
}
