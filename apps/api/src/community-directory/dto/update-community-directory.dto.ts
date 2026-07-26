import { IsString, IsOptional, IsIn } from 'class-validator';

const ROLES = ['MEMBER', 'LEADER', 'HISTORIAN', 'ELDER', 'REPRESENTATIVE'] as const;
const STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING'] as const;

export class UpdateCommunityDirectoryDto {
  @IsOptional()
  @IsString()
  @IsIn(ROLES)
  role?: string;

  @IsOptional()
  @IsString()
  @IsIn(STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
