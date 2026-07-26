import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, BroadcastNotificationDto, UpdatePreferencesDto } from './dto/create-notification.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminApiKeyGuard } from '../auth/guards/admin-api-key.guard';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('isRead') isRead?: string,
    @Query('isArchived') isArchived?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.notificationsService.findAll(userId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      type,
      category,
      priority,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      isArchived: isArchived !== undefined ? isArchived === 'true' : undefined,
      search,
      dateFrom,
      dateTo,
    });
  }

  @Get('unread')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification statistics' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.notificationsService.getStats(userId);
  }

  @Get('preferences')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@CurrentUser('id') userId: string) {
    return this.notificationsService.getPreferences(userId);
  }

  @Get('all')
  @UseGuards(AdminApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notifications (admin only)' })
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('userId') userId?: string,
  ) {
    return this.notificationsService.findAllAdmin({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      type,
      category,
      userId,
    });
  }

  @Get('analytics')
  @UseGuards(AdminApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification analytics (admin only)' })
  async getAnalytics() {
    return this.notificationsService.getAnalytics();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a notification by ID' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.findOne(id, userId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a notification (admin only)' })
  async create(@Body() dto: CreateNotificationDto, @CurrentUser('id') userId: string) {
    return this.notificationsService.create({ ...dto, createdBy: userId });
  }

  @Post('broadcast')
  @UseGuards(AuthGuard('jwt'), AdminApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Broadcast notification (admin only)' })
  async broadcast(@Body() dto: BroadcastNotificationDto, @CurrentUser('id') userId: string) {
    return this.notificationsService.broadcast(dto, userId);
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/archive')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive a notification' })
  async archive(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.archive(id, userId);
  }

  @Patch('preferences')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(userId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a notification' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.remove(id, userId);
  }

  @Delete('clear-read')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear all read notifications' })
  async clearRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.clearRead(userId);
  }
}
