import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookmarkDto {
  @ApiProperty({ enum: ['COMMUNITY', 'CLAN', 'PROFILE'] })
  @IsString()
  @IsIn(['COMMUNITY', 'CLAN', 'PROFILE'])
  entityType: string;

  @ApiProperty()
  @IsString()
  entityId: string;
}
