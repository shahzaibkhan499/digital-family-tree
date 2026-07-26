import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TreeService } from './tree.service';
import {
  CreateTreeViewDto, UpdateTreeViewDto, SaveLayoutCacheDto, ExpandNodeDto,
  CreateBookmarkDto, CreateSearchHistoryDto,
} from './dto/create-tree-view.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tree Engine')
@Controller('tree')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TreeController {
  constructor(private readonly treeService: TreeService) {}

  @Get('family/:familyId')
  @ApiOperation({ summary: 'Get complete family tree' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async getFamilyTree(
    @Param('familyId') familyId: string,
    @Query('depth') depth?: number,
  ) {
    return this.treeService.getFamilyTree(familyId, depth || 10);
  }

  @Get('clan/:clanId')
  @ApiOperation({ summary: 'Get complete clan tree' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async getClanTree(
    @Param('clanId') clanId: string,
    @Query('depth') depth?: number,
  ) {
    return this.treeService.getClanTree(clanId, depth || 5);
  }

  @Get('community/:communityId')
  @ApiOperation({ summary: 'Get complete community tree' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async getCommunityTree(
    @Param('communityId') communityId: string,
    @Query('depth') depth?: number,
  ) {
    return this.treeService.getCommunityTree(communityId, depth || 4);
  }

  @Get('member/:memberId/ancestors')
  @ApiOperation({ summary: 'Get ancestor tree from a member' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async getAncestorTree(
    @Param('memberId') memberId: string,
    @Query('depth') depth?: number,
  ) {
    return this.treeService.getAncestorTree(memberId, depth || 10);
  }

  @Get('member/:memberId/descendants')
  @ApiOperation({ summary: 'Get descendant tree from a member' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  async getDescendantTree(
    @Param('memberId') memberId: string,
    @Query('depth') depth?: number,
  ) {
    return this.treeService.getDescendantTree(memberId, depth || 10);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search within the tree' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  async searchTree(
    @Query('q') query: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.treeService.searchTree(query, entityType, entityId);
  }

  @Get('stats/:entityType/:entityId')
  @ApiOperation({ summary: 'Get tree statistics' })
  async getStats(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.treeService.getStats(entityType, entityId);
  }

  @Get('enhanced-stats/:entityType/:entityId')
  @ApiOperation({ summary: 'Get enhanced tree analytics with growth timeline, family distribution, largest branch' })
  async getEnhancedStats(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.treeService.getEnhancedStats(entityType, entityId);
  }

  @Post('node/expand')
  @ApiOperation({ summary: 'Expand a tree node (lazy load children)' })
  async expandNode(@Body() dto: ExpandNodeDto) {
    return this.treeService.expandNode(dto);
  }

  @Public()
  @Get('views/public')
  @ApiOperation({ summary: 'Get public tree views' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPublicViews(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.treeService.getPublicViews(page || 1, limit || 20);
  }

  @Public()
  @Get('views/public/:id')
  @ApiOperation({ summary: 'Get a single public tree view by id (SEO-friendly)' })
  async getPublicViewById(@Param('id') id: string) {
    return this.treeService.getPublicViewById(id);
  }

  @Public()
  @Get('seo/:entityType/:entityId')
  @ApiOperation({ summary: 'Get SEO metadata for a tree' })
  async getSeoMetadata(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.treeService.getSeoMetadata(entityType, entityId);
  }

  @Post('views')
  @ApiOperation({ summary: 'Create a saved tree view' })
  async createView(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTreeViewDto,
  ) {
    return this.treeService.createView(userId, dto);
  }

  @Get('views')
  @ApiOperation({ summary: 'List my saved tree views' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listViews(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.treeService.listViews(userId, page || 1, limit || 20);
  }

  @Get('views/:id')
  @ApiOperation({ summary: 'Get a saved tree view' })
  async getView(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.treeService.getView(id, userId);
  }

  @Patch('views/:id')
  @ApiOperation({ summary: 'Update a saved tree view' })
  async updateView(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTreeViewDto,
  ) {
    return this.treeService.updateView(id, userId, dto);
  }

  @Delete('views/:id')
  @ApiOperation({ summary: 'Delete a saved tree view' })
  async deleteView(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.treeService.deleteView(id, userId);
  }

  @Post('layout-cache')
  @ApiOperation({ summary: 'Save tree layout cache' })
  async saveLayoutCache(@Body() dto: SaveLayoutCacheDto) {
    return this.treeService.saveLayoutCache(dto);
  }

  @Get('layout-cache')
  @ApiOperation({ summary: 'Get tree layout cache' })
  async getLayoutCache(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @Query('treeType') treeType: string,
    @Query('layout') layout: string,
  ) {
    return this.treeService.getLayoutCache(entityType, entityId, treeType, layout);
  }

  @Post('common-ancestor')
  @ApiOperation({ summary: 'Find common ancestor between two members' })
  async findCommonAncestor(
    @Query('memberIdA') memberIdA: string,
    @Query('memberIdB') memberIdB: string,
    @Query('depth') depth?: number,
  ) {
    return this.treeService.findCommonAncestor(memberIdA, memberIdB, depth || 20);
  }

  @Post('relationship-path')
  @ApiOperation({ summary: 'Find relationship path between two members' })
  async findRelationshipPath(
    @Query('memberIdA') memberIdA: string,
    @Query('memberIdB') memberIdB: string,
    @Query('depth') depth?: number,
  ) {
    return this.treeService.findRelationshipPath(memberIdA, memberIdB, depth || 20);
  }

  @Get('diagnostics/:entityType/:entityId')
  @ApiOperation({ summary: 'Get tree diagnostics (orphans, broken relationships, health score)' })
  async getTreeDiagnostics(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.treeService.getTreeDiagnostics(entityType, entityId);
  }

  @Post('bookmarks')
  @ApiOperation({ summary: 'Bookmark a tree node' })
  async createBookmark(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.treeService.createBookmark(userId, dto);
  }

  @Get('bookmarks')
  @ApiOperation({ summary: 'List my bookmarks' })
  async listBookmarks(
    @CurrentUser('id') userId: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.treeService.listBookmarks(userId, entityType);
  }

  @Delete('bookmarks/:id')
  @ApiOperation({ summary: 'Delete a bookmark' })
  async deleteBookmark(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.treeService.deleteBookmark(id, userId);
  }

  @Post('search-history')
  @ApiOperation({ summary: 'Log a search to history' })
  async logSearchHistory(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSearchHistoryDto,
  ) {
    return this.treeService.logSearchHistory(userId, dto);
  }

  @Get('search-history')
  @ApiOperation({ summary: 'Get search history' })
  async getSearchHistory(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.treeService.getSearchHistory(userId, limit || 20);
  }

  @Delete('search-history/:id')
  @ApiOperation({ summary: 'Delete search history entry' })
  async deleteSearchHistoryEntry(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.treeService.deleteSearchHistoryEntry(id, userId);
  }

  @Get('view-history')
  @ApiOperation({ summary: 'Get recently viewed trees' })
  async getViewHistory(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.treeService.getViewHistory(userId, limit || 20);
  }

  @Delete('view-history/:id')
  @ApiOperation({ summary: 'Delete view history entry' })
  async deleteViewHistoryEntry(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.treeService.deleteViewHistoryEntry(id, userId);
  }

  @Get('recently-added')
  @ApiOperation({ summary: 'Get recently added members' })
  async getRecentlyAddedMembers(@Query('limit') limit?: number) {
    return this.treeService.getRecentlyAddedMembers(limit || 10);
  }

  @Get('recently-updated')
  @ApiOperation({ summary: 'Get recently updated members' })
  async getRecentlyUpdatedMembers(@Query('limit') limit?: number) {
    return this.treeService.getRecentlyUpdatedMembers(limit || 10);
  }

  @Get('popular-branches')
  @ApiOperation({ summary: 'Get popular branches (most members)' })
  async getPopularBranches(@Query('limit') limit?: number) {
    return this.treeService.getPopularBranches(limit || 10);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get tree engine health overview (admin)' })
  async getTreeHealthOverview() {
    return this.treeService.getTreeHealthOverview();
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get tree engine performance stats' })
  async getTreePerformanceStats() {
    return this.treeService.getTreePerformanceStats();
  }
}
