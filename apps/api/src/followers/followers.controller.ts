import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FollowersService } from './followers.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Followers')
@Controller('followers')
export class FollowersController {
  constructor(private readonly followersService: FollowersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's follows" })
  @ApiQuery({ name: 'type', required: false, enum: ['community', 'clan'] })
  async getMyFollows(
    @CurrentUser('id') userId: string,
    @Query('type') type?: 'community' | 'clan',
  ) {
    return this.followersService.getMyFollows(userId, type);
  }

  @Post('community/:communityId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a community' })
  async followCommunity(
    @CurrentUser('id') userId: string,
    @Param('communityId') communityId: string,
  ) {
    return this.followersService.followCommunity(userId, communityId);
  }

  @Delete('community/:communityId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a community' })
  async unfollowCommunity(
    @CurrentUser('id') userId: string,
    @Param('communityId') communityId: string,
  ) {
    return this.followersService.unfollowCommunity(userId, communityId);
  }

  @Get('community/:communityId/check')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if following a community' })
  async isFollowingCommunity(
    @CurrentUser('id') userId: string,
    @Param('communityId') communityId: string,
  ) {
    return this.followersService.isFollowingCommunity(userId, communityId);
  }

  @Get('community/:communityId/count')
  @ApiOperation({ summary: 'Get community follower count' })
  async getCommunityFollowerCount(@Param('communityId') communityId: string) {
    return this.followersService.getCommunityFollowerCount(communityId);
  }

  @Get('community/:communityId')
  @ApiOperation({ summary: 'List community followers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getCommunityFollowers(
    @Param('communityId') communityId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followersService.getCommunityFollowers(
      communityId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('clan/:clanId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a clan' })
  async followClan(
    @CurrentUser('id') userId: string,
    @Param('clanId') clanId: string,
  ) {
    return this.followersService.followClan(userId, clanId);
  }

  @Delete('clan/:clanId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a clan' })
  async unfollowClan(
    @CurrentUser('id') userId: string,
    @Param('clanId') clanId: string,
  ) {
    return this.followersService.unfollowClan(userId, clanId);
  }

  @Get('clan/:clanId/check')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if following a clan' })
  async isFollowingClan(
    @CurrentUser('id') userId: string,
    @Param('clanId') clanId: string,
  ) {
    return this.followersService.isFollowingClan(userId, clanId);
  }

  @Get('clan/:clanId/count')
  @ApiOperation({ summary: 'Get clan follower count' })
  async getClanFollowerCount(@Param('clanId') clanId: string) {
    return this.followersService.getClanFollowerCount(clanId);
  }

  @Get('clan/:clanId')
  @ApiOperation({ summary: 'List clan followers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getClanFollowers(
    @Param('clanId') clanId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followersService.getClanFollowers(
      clanId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
