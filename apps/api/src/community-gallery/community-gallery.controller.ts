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
import { CommunityGalleryService } from './community-gallery.service';
import { CreateCommunityGalleryDto } from './dto/create-community-gallery.dto';
import { UpdateCommunityGalleryDto } from './dto/update-community-gallery.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationService } from '../common/authorization.service';

@ApiTags('Community Gallery')
@Controller('community-gallery')
export class CommunityGalleryController {
  constructor(
    private readonly communityGalleryService: CommunityGalleryService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload to community gallery' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateCommunityGalleryDto) {
    await this.authorizationService.requireCommunityOwnerOrAdmin(userId, dto.communityId);
    return this.communityGalleryService.create(userId, dto);
  }

  @Get('community/:communityId')
  @ApiOperation({ summary: 'Get all gallery items for a community' })
  async findAllByCommunity(
    @Param('communityId') communityId: string,
    @Query('type') type?: string,
    @Query('verified') verified?: string,
  ) {
    return this.communityGalleryService.findAllByCommunity(communityId, type, verified);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a gallery item by ID' })
  async findOne(@Param('id') id: string) {
    return this.communityGalleryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a gallery item' })
  async update(@Param('id') id: string, @Body() dto: UpdateCommunityGalleryDto, @CurrentUser('id') userId: string) {
    return this.communityGalleryService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a gallery item' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.communityGalleryService.delete(id, userId);
  }
}
