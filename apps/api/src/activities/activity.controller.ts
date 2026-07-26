import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ActivityService } from './activity.service';
import { CreateCommentDto, CreateReactionDto } from './dto/create-activity.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminApiKeyGuard } from '../auth/guards/admin-api-key.guard';

@ApiTags('Activities')
@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all activities (paginated)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('eventType') eventType?: string,
    @Query('visibility') visibility?: string,
    @Query('userId') userId?: string,
    @Query('familyId') familyId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.activityService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      eventType,
      visibility,
      userId,
      familyId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    });
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activities for current user' })
  async findMine(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('eventType') eventType?: string,
  ) {
    return this.activityService.findMine(userId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      eventType,
    });
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activity statistics' })
  async getStats() {
    return this.activityService.getStats();
  }

  @Get('family/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activities for a family' })
  async findByFamily(
    @Param('id') familyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('eventType') eventType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.activityService.findByFamily(familyId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      eventType,
      dateFrom,
      dateTo,
    });
  }

  @Get('user/:id')
  @UseGuards(AuthGuard('jwt'), AdminApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activities for a user (admin)' })
  async findByUser(
    @Param('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('eventType') eventType?: string,
  ) {
    return this.activityService.findByUser(userId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      eventType,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single activity' })
  async findOne(@Param('id') id: string) {
    return this.activityService.findOne(id);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to an activity' })
  async addComment(
    @Param('id') activityId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.activityService.addComment(activityId, userId, dto);
  }

  @Delete(':activityId/comments/:commentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a comment from an activity' })
  async removeComment(
    @Param('activityId') activityId: string,
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.activityService.removeComment(activityId, commentId, userId);
  }

  @Post(':id/reactions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle a reaction on an activity' })
  async toggleReaction(
    @Param('id') activityId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReactionDto,
  ) {
    return this.activityService.toggleReaction(activityId, userId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), AdminApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an activity (admin only)' })
  async remove(@Param('id') id: string) {
    return this.activityService.remove(id);
  }
}
