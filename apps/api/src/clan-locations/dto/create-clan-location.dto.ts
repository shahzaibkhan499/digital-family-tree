import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

const LOCATION_TYPES = ['ORIGIN', 'MIGRATION_DESTINATION', 'CURRENT'] as const;

export class CreateClanLocationDto {
  @IsString()
  clanId: string;

  @IsString()
  @IsIn(LOCATION_TYPES)
  type: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  population?: number;

  @IsOptional()
  @IsNumber()
  year?: number;
}
