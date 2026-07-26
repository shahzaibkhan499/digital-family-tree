import { IsString, IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateKnowledgeBaseDto {
  @ApiPropertyOptional({ enum: ['FAQ', 'WIKI', 'ARTICLE', 'RESEARCH_NOTE', 'ORAL_HISTORY', 'REFERENCE', 'SOURCE_CITATION'] })
  @IsOptional()
  @IsString()
  @IsIn(['FAQ', 'WIKI', 'ARTICLE', 'RESEARCH_NOTE', 'ORAL_HISTORY', 'REFERENCE', 'SOURCE_CITATION'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ enum: ['PUBLISHED', 'DRAFT'] })
  @IsOptional()
  @IsString()
  @IsIn(['PUBLISHED', 'DRAFT'])
  status?: string;
}
