import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ClanHistoryService } from './clan-history.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationService } from '../common/authorization.service';

@ApiTags('Clan History')
@Controller()
export class ClanHistoryController {
  constructor(
    private readonly clanHistoryService: ClanHistoryService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Get('clans/:clanId/history/pending')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending history entries for moderation' })
  async getPendingEntries(@Param('clanId') clanId: string) {
    return this.clanHistoryService.getPendingEntries(clanId);
  }

  @Get('clans/:clanId/history/all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all history entries with moderation status' })
  async getAllEntriesWithModeration(@Param('clanId') clanId: string) {
    return this.clanHistoryService.getAllEntriesWithModeration(clanId);
  }

  @Get('clans/:clanId/history/:section')
  @ApiOperation({ summary: 'Get history for a specific section' })
  async getSectionHistory(
    @Param('clanId') clanId: string,
    @Param('section') section: string,
  ) {
    return this.clanHistoryService.getSectionHistory(clanId, section);
  }

  @Get('clans/:clanId/history')
  @ApiOperation({ summary: 'Get all history for a clan' })
  async getHistory(@Param('clanId') clanId: string) {
    return this.clanHistoryService.getHistory(clanId);
  }

  @Post('clans/:clanId/history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a history entry' })
  async createEntry(
    @CurrentUser('id') userId: string,
    @Param('clanId') clanId: string,
    @Body('section') section: string,
    @Body('content') content: string,
  ) {
    await this.authorizationService.requireClanOwnerOrAdmin(userId, clanId);
    return this.clanHistoryService.createEntry(userId, clanId, section, content);
  }

  @Patch('clan-history/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a history entry (creates new version)' })
  async updateEntry(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.clanHistoryService.updateEntry(userId, id, content);
  }

  @Get('clan-history/:id/versions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all versions for a history section' })
  async getEntryVersions(
    @Param('id') id: string,
    @Body('clanId') clanId: string,
    @Body('section') section: string,
  ) {
    return this.clanHistoryService.getEntryVersions(clanId, section);
  }

  @Patch('clan-history/:id/approve')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a history entry' })
  async approveEntry(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.clanHistoryService.approveEntry(userId, id, note);
  }

  @Patch('clan-history/:id/reject')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a history entry' })
  async rejectEntry(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.clanHistoryService.rejectEntry(userId, id, note);
  }

  @Patch('clan-history/:id/request-changes')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request changes on a history entry' })
  async requestChanges(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('note') note: string,
  ) {
    return this.clanHistoryService.requestChanges(userId, id, note);
  }
}
