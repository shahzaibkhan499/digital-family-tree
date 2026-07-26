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
import { ClanEventsService } from './clan-events.service';
import { CreateClanEventDto } from './dto/create-clan-event.dto';
import { UpdateClanEventDto } from './dto/update-clan-event.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationService } from '../common/authorization.service';

@ApiTags('Clan Events')
@Controller('clan-events')
export class ClanEventsController {
  constructor(
    private readonly clanEventsService: ClanEventsService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a clan event' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateClanEventDto) {
    await this.authorizationService.requireClanOwnerOrAdmin(userId, dto.clanId);
    return this.clanEventsService.create(userId, dto);
  }

  @Get('clan/:clanId/stats')
  @ApiOperation({ summary: 'Get event stats for a clan' })
  async getStats(@Param('clanId') clanId: string) {
    return this.clanEventsService.getStats(clanId);
  }

  @Get('clan/:clanId')
  @ApiOperation({ summary: 'Get all events for a clan' })
  async findAllByClan(
    @Param('clanId') clanId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('upcoming') upcoming?: string,
  ) {
    return this.clanEventsService.findAllByClan(clanId, type, status, upcoming);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event by ID' })
  async findOne(@Param('id') id: string) {
    return this.clanEventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event' })
  async update(@Param('id') id: string, @Body() dto: UpdateClanEventDto, @CurrentUser('id') userId: string) {
    return this.clanEventsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an event' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clanEventsService.delete(id, userId);
  }
}
