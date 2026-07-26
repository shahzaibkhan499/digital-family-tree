import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Bookmarks')
@Controller('bookmarks')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a bookmark' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.bookmarksService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "List current user's bookmarks" })
  @ApiQuery({ name: 'entityType', required: false, enum: ['COMMUNITY', 'CLAN', 'PROFILE'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findByUser(
    @CurrentUser('id') userId: string,
    @Query('entityType') entityType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookmarksService.findByUser(
      userId,
      entityType,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('check')
  @ApiOperation({ summary: 'Check if entity is bookmarked' })
  @ApiQuery({ name: 'entityType', required: true })
  @ApiQuery({ name: 'entityId', required: true })
  async check(
    @CurrentUser('id') userId: string,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.bookmarksService.check(userId, entityType, entityId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bookmark' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.bookmarksService.delete(userId, id);
  }
}
