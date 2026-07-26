import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FeaturedService } from './featured.service';

@ApiTags('Featured')
@Controller('featured')
export class FeaturedController {
  constructor(private readonly featuredService: FeaturedService) {}

  @Get('communities')
  @ApiOperation({ summary: 'Get featured communities' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFeaturedCommunities(@Query('limit') limit?: string) {
    return this.featuredService.getFeaturedCommunities(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('clans')
  @ApiOperation({ summary: 'Get featured clans' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFeaturedClans(@Query('limit') limit?: string) {
    return this.featuredService.getFeaturedClans(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('communities/trending')
  @ApiOperation({ summary: 'Get trending communities' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTrendingCommunities(@Query('limit') limit?: string) {
    return this.featuredService.getTrendingCommunities(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('clans/trending')
  @ApiOperation({ summary: 'Get trending clans' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTrendingClans(@Query('limit') limit?: string) {
    return this.featuredService.getTrendingClans(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('communities/:communityId/related')
  @ApiOperation({ summary: 'Get related communities' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRelatedCommunities(
    @Param('communityId') communityId: string,
    @Query('limit') limit?: string,
  ) {
    return this.featuredService.getRelatedCommunities(
      communityId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('clans/:clanId/related')
  @ApiOperation({ summary: 'Get related clans' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRelatedClans(
    @Param('clanId') clanId: string,
    @Query('limit') limit?: string,
  ) {
    return this.featuredService.getRelatedClans(
      clanId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('community-stats/:communityId')
  @ApiOperation({ summary: 'Get comprehensive community stats' })
  async getCommunityStats(@Param('communityId') communityId: string) {
    return this.featuredService.getCommunityStats(communityId);
  }

  @Get('clan-stats/:clanId')
  @ApiOperation({ summary: 'Get comprehensive clan stats' })
  async getClanStats(@Param('clanId') clanId: string) {
    return this.featuredService.getClanStats(clanId);
  }
}
