import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTreeViewDto {
  @ApiProperty({ example: 'My Family Tree' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A complete tree of the Kakar family' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'FAMILY', enum: ['FAMILY', 'CLAN', 'COMMUNITY', 'ANCESTOR', 'DESCENDANT', 'RELATIONSHIP', 'BRANCH'] })
  @IsString()
  treeType: string;

  @ApiProperty({ example: 'FAMILY', enum: ['FAMILY', 'MEMBER', 'CLAN', 'COMMUNITY', 'SUBCLAN'] })
  @IsString()
  rootEntityType: string;

  @ApiProperty({ example: 'uuid-of-entity' })
  @IsString()
  rootEntityId: string;

  @ApiPropertyOptional({ example: 'VERTICAL', enum: ['VERTICAL', 'HORIZONTAL', 'COMPACT', 'BALANCED'] })
  @IsOptional()
  @IsString()
  layout?: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsObject()
  viewport?: Record<string, any>;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateTreeViewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  layout?: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsObject()
  viewport?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class SaveLayoutCacheDto {
  @ApiProperty({ example: 'FAMILY' })
  @IsString()
  entityType: string;

  @ApiProperty({ example: 'uuid-of-family' })
  @IsString()
  entityId: string;

  @ApiProperty({ example: 'FAMILY_TREE' })
  @IsString()
  treeType: string;

  @ApiProperty({ example: 'VERTICAL' })
  @IsString()
  layout: string;

  @ApiProperty({ example: { "member-uuid": { "x": 100, "y": 200 } } })
  @IsObject()
  nodePositions: Record<string, { x: number; y: number }>;
}

export class ExpandNodeDto {
  @ApiProperty({ example: 'MEMBER' })
  @IsString()
  entityType: string;

  @ApiProperty({ example: 'uuid-of-member' })
  @IsString()
  entityId: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  depth?: number;
}

export class CreateBookmarkDto {
  @ApiProperty({ example: 'MEMBER' })
  @IsString()
  entityType: string;

  @ApiProperty({ example: 'uuid-of-member' })
  @IsString()
  entityId: string;

  @ApiPropertyOptional({ example: 'John Smith' })
  @IsOptional()
  @IsString()
  entityName?: string;

  @ApiPropertyOptional({ example: 'MEMBER' })
  @IsOptional()
  @IsString()
  entityTypeRef?: string;

  @ApiPropertyOptional({ example: '#FF5733' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'Important ancestor' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateSearchHistoryDto {
  @ApiProperty({ example: 'Kakar' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ example: 'FAMILY' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  resultCount?: number;
}

export class CommonAncestorDto {
  @ApiProperty({ example: 'uuid-of-member-1' })
  @IsString()
  memberIdA: string;

  @ApiProperty({ example: 'uuid-of-member-2' })
  @IsString()
  memberIdB: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  depth?: number;
}

export class RelationshipPathDto {
  @ApiProperty({ example: 'uuid-of-member-1' })
  @IsString()
  memberIdA: string;

  @ApiProperty({ example: 'uuid-of-member-2' })
  @IsString()
  memberIdB: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  depth?: number;
}

export class TreeDiagnosticsDto {
  @ApiProperty({ example: 'FAMILY' })
  @IsString()
  entityType: string;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  entityId: string;
}
