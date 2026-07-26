import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StoreClanInsightDto {
  @ApiProperty({ enum: ['RELATIONSHIP_FINDER', 'COMMON_ANCESTOR', 'DUPLICATE_DETECTION', 'FAMILY_SUGGESTIONS'] })
  @IsString()
  @IsIn(['RELATIONSHIP_FINDER', 'COMMON_ANCESTOR', 'DUPLICATE_DETECTION', 'FAMILY_SUGGESTIONS'])
  type: string;

  @ApiProperty()
  @IsString()
  content: string;
}
