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
import { CommunityEventsService } from './community-events.service';
import { CreateCommunityEventDto } from './dto/create-community-event.dto';
import { UpdateCommunityEventDto } from './dto/update-community-event.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationService } from '../common/authorization.service';

@ApiTags('Community Events')
@Controller('community-events')
export class CommunityEventsController {
  constructor(
    private readonly communityEventsService: CommunityEventsService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a community event' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateCommunityEventDto) {
    await this.authorizationService.requireCommunityOwnerOrAdmin(userId, dto.communityId);
    return this.communityEventsService.create(userId, dto);
  }

  @Get('community/:communityId/stats')
  @ApiOperation({ summary: 'Get event stats for a community' })
  async getStats(@Param('communityId') communityId: string) {
    return this.communityEventsService.getStats(communityId);
  }

  @Get('community/:communityId')
  @ApiOperation({ summary: 'Get all events for a community' })
  async findAllByCommunity(
    @Param('communityId') communityId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('upcoming') upcoming?: string,
  ) {
    return this.communityEventsService.findAllByCommunity(communityId, type, status, upcoming);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event by ID' })
  async findOne(@Param('id') id: string) {
    return this.communityEventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event' })
  async update(@Param('id') id: string, @Body() dto: UpdateCommunityEventDto, @CurrentUser('id') userId: string) {
    return this.communityEventsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an event' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.communityEventsService.delete(id, userId);
  }
}
