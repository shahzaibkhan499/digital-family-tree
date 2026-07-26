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
import { CommunityNewsService } from './community-news.service';
import { CreateCommunityNewsDto } from './dto/create-community-news.dto';
import { UpdateCommunityNewsDto } from './dto/update-community-news.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationService } from '../common/authorization.service';

@ApiTags('Community News')
@Controller('community-news')
export class CommunityNewsController {
  constructor(
    private readonly communityNewsService: CommunityNewsService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create community news' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateCommunityNewsDto) {
    await this.authorizationService.requireCommunityOwnerOrAdmin(userId, dto.communityId);
    return this.communityNewsService.create(userId, dto);
  }

  @Get('community/:communityId')
  @ApiOperation({ summary: 'Get all news for a community' })
  async findAllByCommunity(
    @Param('communityId') communityId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('featured') featured?: string,
  ) {
    return this.communityNewsService.findAllByCommunity(communityId, type, status, featured);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a news item by ID' })
  async findOne(@Param('id') id: string) {
    return this.communityNewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a news item' })
  async update(@Param('id') id: string, @Body() dto: UpdateCommunityNewsDto, @CurrentUser('id') userId: string) {
    return this.communityNewsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a news item' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.communityNewsService.delete(id, userId);
  }
}
