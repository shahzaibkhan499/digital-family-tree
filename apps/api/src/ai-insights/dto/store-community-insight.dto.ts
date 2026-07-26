import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StoreCommunityInsightDto {
  @ApiProperty({ enum: ['SUMMARY', 'INSIGHTS', 'STATISTICS', 'RECOMMENDATIONS'] })
  @IsString()
  @IsIn(['SUMMARY', 'INSIGHTS', 'STATISTICS', 'RECOMMENDATIONS'])
  type: string;

  @ApiProperty()
  @IsString()
  content: string;
}
