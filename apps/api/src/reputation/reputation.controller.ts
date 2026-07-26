import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReputationService } from './reputation.service';

@ApiTags('Reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('community/:communityId')
  @ApiOperation({ summary: 'Get community reputation' })
  async getCommunityReputation(@Param('communityId') communityId: string) {
    return this.reputationService.getCommunityReputation(communityId);
  }

  @Post('community/:communityId/calculate')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Recalculate community reputation' })
  async calculateCommunityReputation(@Param('communityId') communityId: string) {
    return this.reputationService.calculateCommunityReputation(communityId);
  }

  @Get('clan/:clanId')
  @ApiOperation({ summary: 'Get clan reputation' })
  async getClanReputation(@Param('clanId') clanId: string) {
    return this.reputationService.getClanReputation(clanId);
  }

  @Post('clan/:clanId/calculate')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Recalculate clan reputation' })
  async calculateClanReputation(@Param('clanId') clanId: string) {
    return this.reputationService.calculateClanReputation(clanId);
  }

  @Get('communities/top')
  @ApiOperation({ summary: 'Get top communities by reputation' })
  @ApiQuery({ name: 'sort', required: false, enum: ['trustScore', 'heritageScore', 'contributionScore'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopCommunities(
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reputationService.getTopCommunities(
      sort || 'trustScore',
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('clans/top')
  @ApiOperation({ summary: 'Get top clans by reputation' })
  @ApiQuery({ name: 'sort', required: false, enum: ['heritageScore', 'preservationScore'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopClans(
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reputationService.getTopClans(
      sort || 'heritageScore',
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
