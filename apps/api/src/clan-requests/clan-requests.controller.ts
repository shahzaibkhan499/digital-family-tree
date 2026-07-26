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
import { ClanRequestsService } from './clan-requests.service';
import { CreateClanRequestDto } from './dto/create-clan-request.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Clan Requests')
@Controller()
export class ClanRequestsController {
  constructor(private readonly clanRequestsService: ClanRequestsService) {}

  @Post('clans/:clanId/requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a join request for a clan' })
  async createRequest(
    @CurrentUser('id') userId: string,
    @Param('clanId') clanId: string,
    @Body() dto: CreateClanRequestDto,
  ) {
    return this.clanRequestsService.createRequest(userId, clanId, dto);
  }

  @Get('clans/:clanId/requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List requests for a clan' })
  async listRequests(
    @Param('clanId') clanId: string,
    @Query('status') status?: string,
  ) {
    return this.clanRequestsService.listRequests(clanId, status);
  }

  @Get('clans/:clanId/requests/stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get request stats for a clan' })
  async getStats(@Param('clanId') clanId: string) {
    return this.clanRequestsService.getStats(clanId);
  }

  @Get('clan-requests/mine')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my join requests' })
  async getUserRequests(@CurrentUser('id') userId: string) {
    return this.clanRequestsService.getUserRequests(userId);
  }

  @Patch('clan-requests/:id/accept')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a join request (admin/owner only)' })
  async acceptRequest(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('response') response?: string,
  ) {
    return this.clanRequestsService.acceptRequest(id, userId, response);
  }

  @Patch('clan-requests/:id/reject')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a join request (admin/owner only)' })
  async rejectRequest(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('response') response?: string,
  ) {
    return this.clanRequestsService.rejectRequest(id, userId, response);
  }

  @Delete('clan-requests/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a pending request' })
  async cancelRequest(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clanRequestsService.cancelRequest(id, userId);
  }
}
