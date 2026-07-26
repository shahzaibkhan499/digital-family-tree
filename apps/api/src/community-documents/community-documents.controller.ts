import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CommunityDocumentsService } from './community-documents.service';
import { CreateCommunityDocumentDto } from './dto/create-community-document.dto';
import { UpdateCommunityDocumentDto } from './dto/update-community-document.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationService } from '../common/authorization.service';

@ApiTags('Community Documents')
@Controller('community-documents')
export class CommunityDocumentsController {
  constructor(
    private readonly communityDocumentsService: CommunityDocumentsService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a community document' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateCommunityDocumentDto) {
    await this.authorizationService.requireCommunityOwnerOrAdmin(userId, dto.communityId);
    return this.communityDocumentsService.create(userId, dto);
  }

  @Get('community/:communityId')
  @ApiOperation({ summary: 'Get all documents for a community' })
  async findAllByCommunity(
    @Param('communityId') communityId: string,
    @Query('type') type?: string,
    @Query('verified') verified?: string,
    @Query('status') status?: string,
  ) {
    return this.communityDocumentsService.findAllByCommunity(communityId, type, verified, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  async findOne(@Param('id') id: string) {
    return this.communityDocumentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a document' })
  async update(@Param('id') id: string, @Body() dto: UpdateCommunityDocumentDto, @CurrentUser('id') userId: string) {
    return this.communityDocumentsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a document' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.communityDocumentsService.delete(id, userId);
  }
}
