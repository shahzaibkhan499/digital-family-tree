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
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Communities')
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new community' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateCommunityDto) {
    return this.communitiesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all communities (public)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('country') country?: string,
    @Query('verified') verified?: string,
  ) {
    return this.communitiesService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
      status,
      country,
      verified,
    );
  }

  @Get('top')
  @ApiOperation({ summary: 'Get top communities by clan count' })
  async getTopCommunities(@Query('limit') limit?: string) {
    return this.communitiesService.getTopCommunities(limit ? parseInt(limit, 10) : 10);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular communities by member count' })
  async getPopularCommunities(@Query('limit') limit?: string) {
    return this.communitiesService.getPopularCommunities(limit ? parseInt(limit, 10) : 10);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recently created communities' })
  async getRecentCommunities(@Query('limit') limit?: string) {
    return this.communitiesService.getRecentCommunities(limit ? parseInt(limit, 10) : 10);
  }

  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get communities for current user' })
  async getCommunitiesForUser(@CurrentUser('id') userId: string) {
    return this.communitiesService.getCommunitiesForUser(userId);
  }

  @Get(':slug/stats')
  @ApiOperation({ summary: 'Get community statistics' })
  async getStats(@Param('slug') slug: string) {
    return this.communitiesService.getStats(slug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a community by slug (public)' })
  async findBySlug(@Param('slug') slug: string, @CurrentUser('id') userId?: string) {
    return this.communitiesService.findBySlug(slug, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a community' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCommunityDto,
  ) {
    return this.communitiesService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a community' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.communitiesService.remove(id, userId);
  }

  // Community Admin management
  @Post(':id/admins')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add an admin to a community' })
  async addAdmin(
    @CurrentUser('id') userId: string,
    @Param('id') communityId: string,
    @Body() dto: { userId: string; role?: string },
  ) {
    return this.communitiesService.addAdmin(userId, communityId, dto.userId, dto.role);
  }

  @Get(':id/admins')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List admins for a community' })
  async getAdmins(@Param('id') communityId: string) {
    return this.communitiesService.getAdmins(communityId);
  }

  @Patch(':id/admins/:adminId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a community admin role' })
  async updateAdmin(
    @CurrentUser('id') userId: string,
    @Param('id') communityId: string,
    @Param('adminId') adminId: string,
    @Body() dto: { role: string },
  ) {
    return this.communitiesService.updateAdmin(userId, communityId, adminId, dto.role);
  }

  @Delete(':id/admins/:adminId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a community admin' })
  async removeAdmin(
    @CurrentUser('id') userId: string,
    @Param('id') communityId: string,
    @Param('adminId') adminId: string,
  ) {
    return this.communitiesService.removeAdmin(userId, communityId, adminId);
  }

  // Community Join Requests
  @Post(':id/requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a community join request' })
  async createRequest(
    @CurrentUser('id') userId: string,
    @Param('id') communityId: string,
    @Body() dto: { familyId: string; message?: string },
  ) {
    return this.communitiesService.createRequest(userId, communityId, dto.familyId, dto.message);
  }

  @Get(':id/requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List community join requests' })
  async getRequests(@Param('id') communityId: string, @Query('status') status?: string) {
    return this.communitiesService.getRequests(communityId, status);
  }

  @Get(':id/requests/stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get community request statistics' })
  async getRequestStats(@Param('id') communityId: string) {
    return this.communitiesService.getRequestStats(communityId);
  }

  @Patch(':id/requests/:requestId/approve')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a community join request' })
  async approveRequest(
    @CurrentUser('id') userId: string,
    @Param('id') communityId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.communitiesService.approveRequest(userId, requestId);
  }

  @Patch(':id/requests/:requestId/reject')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a community join request' })
  async rejectRequest(
    @CurrentUser('id') userId: string,
    @Param('id') communityId: string,
    @Param('requestId') requestId: string,
    @Body() dto?: { response?: string },
  ) {
    return this.communitiesService.rejectRequest(userId, requestId, dto?.response);
  }

  @Delete(':id/requests/:requestId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a community join request' })
  async cancelRequest(
    @CurrentUser('id') userId: string,
    @Param('id') communityId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.communitiesService.cancelRequest(userId, requestId);
  }
}
