import { IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKnowledgeBaseDto {
  @ApiProperty({ enum: ['COMMUNITY', 'CLAN'] })
  @IsString()
  @IsIn(['COMMUNITY', 'CLAN'])
  entityType: string;

  @ApiProperty()
  @IsString()
  entityId: string;

  @ApiProperty({ enum: ['FAQ', 'WIKI', 'ARTICLE', 'RESEARCH_NOTE', 'ORAL_HISTORY', 'REFERENCE', 'SOURCE_CITATION'] })
  @IsString()
  @IsIn(['FAQ', 'WIKI', 'ARTICLE', 'RESEARCH_NOTE', 'ORAL_HISTORY', 'REFERENCE', 'SOURCE_CITATION'])
  type: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: ['PUBLISHED', 'DRAFT'] })
  @IsOptional()
  @IsString()
  @IsIn(['PUBLISHED', 'DRAFT'])
  status?: string;
}
