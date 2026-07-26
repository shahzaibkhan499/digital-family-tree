import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DocumentVaultService } from './document-vault.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CreateShareDto } from './dto/create-share.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Document Vault')
@Controller('document-vault')
export class DocumentVaultController {
  constructor(private readonly service: DocumentVaultService) {}

  // === EXISTING CRUD ===

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a document' })
  async createDocument(@CurrentUser('id') userId: string, @Body() dto: CreateDocumentDto) {
    return this.service.createDocument(userId, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my documents' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('documentType') documentType?: string,
    @Query('visibility') visibility?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('familyId') familyId?: string,
    @Query('clanId') clanId?: string,
    @Query('communityId') communityId?: string,
    @Query('folderId') folderId?: string,
    @Query('isFavorite') isFavorite?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.service.findAllByOwner(userId, {
      documentType, visibility, verificationStatus, familyId,
      clanId, communityId, folderId, isFavorite, search,
      page, limit, sortBy, sortOrder,
    });
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vault stats' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.service.getStats(userId);
  }

  @Get('search')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search documents' })
  async search(@CurrentUser('id') userId: string, @Query('q') q: string) {
    return this.service.search(userId, q || '');
  }

  @Get('recent')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent documents' })
  async getRecent(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.service.getRecent(userId, parseInt(limit || '10'));
  }

  @Get('shared-with-me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get documents shared with me' })
  async getSharedWithMe(@CurrentUser('id') userId: string) {
    return this.service.getSharedWithMe(userId);
  }

  @Get('deleted')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get deleted documents' })
  async getDeleted(@CurrentUser('id') userId: string) {
    return this.service.getDeleted(userId);
  }

  @Get('access/:token')
  @ApiOperation({ summary: 'Access document via share link' })
  async accessViaToken(@Param('token') token: string) {
    return this.service.accessViaToken(token);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get document by ID' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update document' })
  async update(@Param('id') id: string, @Body() dto: UpdateDocumentDto, @CurrentUser('id') userId: string) {
    return this.service.update(id, dto, userId);
  }

  @Patch(':id/favorite')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle favorite' })
  async toggleFavorite(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.toggleFavorite(id, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete document' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.delete(id, userId);
  }

  @Patch(':id/restore')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore deleted document' })
  async restore(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.restore(id, userId);
  }

  @Delete(':id/permanent')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete document' })
  async permanentDelete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.permanentlyDelete(id, userId);
  }

  // === VERSIONING ===

  @Post(':id/versions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new version' })
  async createVersion(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: CreateVersionDto) {
    return this.service.createVersion(id, userId, dto);
  }

  @Get(':id/versions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all versions' })
  async getVersions(@Param('id') id: string) {
    return this.service.getVersions(id);
  }

  @Patch(':id/versions/:version/restore')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore specific version' })
  async restoreVersion(@Param('id') id: string, @Param('version') version: string, @CurrentUser('id') userId: string) {
    return this.service.restoreVersion(id, parseInt(version), userId);
  }

  // === FOLDERS ===

  @Post('folders')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create folder' })
  async createFolder(@CurrentUser('id') userId: string, @Body() dto: CreateFolderDto) {
    return this.service.createFolder(userId, dto);
  }

  @Get('folders/list')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List folders' })
  async getFolders(
    @CurrentUser('id') userId: string,
    @Query('familyId') familyId?: string,
    @Query('clanId') clanId?: string,
    @Query('communityId') communityId?: string,
    @Query('parentId') parentId?: string,
  ) {
    return this.service.getFolders(userId, { familyId, clanId, communityId, parentId });
  }

  @Get('folders/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get folder contents' })
  async getFolder(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.getFolder(id, userId);
  }

  @Patch('folders/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update folder' })
  async updateFolder(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: { name?: string; description?: string; color?: string; icon?: string }) {
    return this.service.updateFolder(id, userId, dto);
  }

  @Delete('folders/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete folder' })
  async deleteFolder(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.deleteFolder(id, userId);
  }

  // === SHARING ===

  @Post('shares')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share document' })
  async createShare(@CurrentUser('id') userId: string, @Body() dto: CreateShareDto) {
    return this.service.createShare(userId, dto);
  }

  @Get(':id/shares')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get document shares' })
  async getShares(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.getShares(id, userId);
  }

  @Delete('shares/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke share' })
  async revokeShare(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.revokeShare(id, userId);
  }

  // === ACCESS LOGS ===

  @Get(':id/access-logs')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get access logs' })
  async getAccessLogs(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.getAccessLogs(id, userId);
  }

  // === COLLECTIONS ===

  @Post('collections')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create collection' })
  async createCollection(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.createCollection(userId, dto);
  }

  @Get('collections/list')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List collections' })
  async getCollections(
    @CurrentUser('id') userId: string,
    @Query('collectionType') collectionType?: string,
    @Query('visibility') visibility?: string,
    @Query('familyId') familyId?: string,
    @Query('clanId') clanId?: string,
    @Query('communityId') communityId?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    return this.service.getCollections(userId, { collectionType, visibility, familyId, clanId, communityId, isFeatured });
  }

  @Get('collections/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get collection with items' })
  async getCollection(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.getCollection(id, userId);
  }

  @Patch('collections/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update collection' })
  async updateCollection(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.updateCollection(id, userId, dto);
  }

  @Delete('collections/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete collection' })
  async deleteCollection(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.deleteCollection(id, userId);
  }

  @Post('collections/:id/items')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add document to collection' })
  async addToCollection(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: { documentId: string; note?: string }) {
    return this.service.addToCollection(id, userId, dto.documentId, dto.note);
  }

  @Delete('collections/:collectionId/items/:itemId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove document from collection' })
  async removeFromCollection(@Param('collectionId') collectionId: string, @Param('itemId') itemId: string, @CurrentUser('id') userId: string) {
    return this.service.removeFromCollection(collectionId, itemId, userId);
  }

  // === ATTACHMENTS ===

  @Post('attachments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create attachment (link doc to entity)' })
  async createAttachment(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.createAttachment(userId, dto);
  }

  @Get('attachments/:entityType/:entityId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get attachments for entity' })
  async getAttachments(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.service.getAttachments(entityType, entityId);
  }

  @Delete('attachments/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove attachment' })
  async removeAttachment(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.removeAttachment(id, userId);
  }

  // === VERIFICATIONS ===

  @Post('verifications')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit verification' })
  async createVerification(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.createVerification(userId, dto);
  }

  @Get('verifications/:documentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get verifications for document' })
  async getVerifications(@Param('documentId') documentId: string) {
    return this.service.getVerifications(documentId);
  }

  @Patch('verifications/:id/review')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review verification' })
  async reviewVerification(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: { status: string; notes?: string }) {
    return this.service.reviewVerification(id, userId, dto.status, dto.notes);
  }

  // === GALLERY ===

  @Post('gallery')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create gallery item' })
  async createGallery(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.createGallery(userId, dto);
  }

  @Get('gallery/list')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List gallery items' })
  async getGalleries(
    @CurrentUser('id') userId: string,
    @Query('galleryType') galleryType?: string,
    @Query('visibility') visibility?: string,
    @Query('albumName') albumName?: string,
    @Query('familyId') familyId?: string,
    @Query('clanId') clanId?: string,
    @Query('communityId') communityId?: string,
  ) {
    return this.service.getGalleries(userId, { galleryType, visibility, albumName, familyId, clanId, communityId });
  }

  @Get('gallery/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get gallery item' })
  async getGallery(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.getGallery(id, userId);
  }

  @Patch('gallery/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update gallery' })
  async updateGallery(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.updateGallery(id, userId, dto);
  }

  @Delete('gallery/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete gallery' })
  async deleteGallery(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.deleteGallery(id, userId);
  }

  // === REFERENCES ===

  @Post('references')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create reference' })
  async createReference(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.createReference(userId, dto);
  }

  @Get('references/list')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List references' })
  async getReferences(
    @CurrentUser('id') userId: string,
    @Query('documentId') documentId?: string,
    @Query('galleryId') galleryId?: string,
    @Query('referenceType') referenceType?: string,
    @Query('reliability') reliability?: string,
  ) {
    return this.service.getReferences(userId, { documentId, galleryId, referenceType, reliability });
  }

  @Patch('references/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update reference' })
  async updateReference(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.updateReference(id, userId, dto);
  }

  @Delete('references/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete reference' })
  async deleteReference(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.deleteReference(id, userId);
  }

  // === PUBLIC PAGES ===

  @Post('public-pages')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create public page' })
  async createPublicPage(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.createPublicPage(userId, dto);
  }

  @Get('public-pages/mine')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my public pages' })
  async getMyPublicPages(@CurrentUser('id') userId: string) {
    return this.service.getMyPublicPages(userId);
  }

  @Patch('public-pages/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update public page' })
  async updatePublicPage(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.updatePublicPage(id, userId, dto);
  }

  @Delete('public-pages/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete public page' })
  async deletePublicPage(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.deletePublicPage(id, userId);
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'View public page by slug' })
  async viewPublicPage(@Param('slug') slug: string) {
    return this.service.getPublicPage(slug);
  }

  // === KNOWLEDGE BASE ===

  @Post('knowledge-base')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create knowledge base entry' })
  async createKnowledgeBaseEntry(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.createKnowledgeBaseEntry(userId, dto);
  }

  @Get('knowledge-base/list')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List knowledge base entries' })
  async getKnowledgeBaseEntries(
    @CurrentUser('id') userId: string,
    @Query('articleType') articleType?: string,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
    @Query('collectionId') collectionId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getKnowledgeBaseEntries(userId, { articleType, status, visibility, collectionId, search });
  }

  @Get('knowledge-base/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get knowledge base entry' })
  async getKnowledgeBaseEntry(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.getKnowledgeBaseEntry(id, userId);
  }

  @Patch('knowledge-base/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update knowledge base entry' })
  async updateKnowledgeBaseEntry(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.updateKnowledgeBaseEntry(id, userId, dto);
  }

  @Delete('knowledge-base/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete knowledge base entry' })
  async deleteKnowledgeBaseEntry(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.deleteKnowledgeBaseEntry(id, userId);
  }

  @Post('knowledge-base/:id/vote')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on knowledge base entry' })
  async voteKnowledgeBase(@Param('id') id: string, @Body() dto: { helpful: boolean }) {
    return this.service.voteKnowledgeBase(id, dto.helpful);
  }

  // === ANALYTICS ===

  @Get('analytics/trending')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trending documents' })
  async getTrending(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.service.getTrending(userId, parseInt(limit || '10'));
  }

  @Get('analytics/featured')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get featured documents' })
  async getFeatured(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.service.getFeatured(userId, parseInt(limit || '10'));
  }

  @Get('analytics/most-viewed')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get most viewed documents' })
  async getMostViewed(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.service.getMostViewed(userId, parseInt(limit || '10'));
  }

  @Get('analytics/verified')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get verified documents' })
  async getVerified(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.service.getVerified(userId, parseInt(limit || '20'));
  }

  @Get('analytics/storage')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get storage analytics' })
  async getStorageAnalytics(@CurrentUser('id') userId: string) {
    return this.service.getStorageAnalytics(userId);
  }

  // === TIMELINE INTEGRATION ===

  @Get('timeline/family/:familyId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get documents for family timeline' })
  async getFamilyTimelineDocuments(@Param('familyId') familyId: string, @CurrentUser('id') userId: string) {
    return this.service.getTimelineDocuments('family', familyId, userId);
  }

  @Get('timeline/clan/:clanId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get documents for clan timeline' })
  async getClanTimelineDocuments(@Param('clanId') clanId: string, @CurrentUser('id') userId: string) {
    return this.service.getTimelineDocuments('clan', clanId, userId);
  }

  @Get('timeline/community/:communityId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get documents for community timeline' })
  async getCommunityTimelineDocuments(@Param('communityId') communityId: string, @CurrentUser('id') userId: string) {
    return this.service.getTimelineDocuments('community', communityId, userId);
  }

  @Get('timeline/member/:memberId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get documents for member timeline' })
  async getMemberTimelineDocuments(@Param('memberId') memberId: string, @CurrentUser('id') userId: string) {
    return this.service.getTimelineDocuments('member', memberId, userId);
  }

  // === SMART ORGANIZATION ===

  @Post('auto-tag/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Auto-tag a document based on content and metadata' })
  async autoTagDocument(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.autoTagDocument(id, userId);
  }

  @Get('suggestions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization suggestions for documents' })
  async getOrganizationSuggestions(@CurrentUser('id') userId: string) {
    return this.service.getOrganizationSuggestions(userId);
  }
}
