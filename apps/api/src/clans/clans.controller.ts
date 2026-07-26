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
import { ClansService } from './clans.service';
import { CreateClanDto } from './dto/create-clan.dto';
import { UpdateClanDto } from './dto/update-clan.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Clans')
@Controller('clans')
export class ClansController {
  constructor(private readonly clansService: ClansService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new clan' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateClanDto) {
    return this.clansService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all clans (public)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('country') country?: string,
    @Query('verified') verified?: string,
  ) {
    return this.clansService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
      status,
      country,
      verified,
    );
  }

  @Get('top')
  @ApiOperation({ summary: 'Get top clans by family count' })
  async getTopClans(@Query('limit') limit?: string) {
    return this.clansService.getTopClans(limit ? parseInt(limit, 10) : 10);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular clans by member count' })
  async getPopularClans(@Query('limit') limit?: string) {
    return this.clansService.getPopularClans(limit ? parseInt(limit, 10) : 10);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recently created clans' })
  async getRecentClans(@Query('limit') limit?: string) {
    return this.clansService.getRecentClans(limit ? parseInt(limit, 10) : 10);
  }

  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get clans for current user' })
  async getClansForUser(@CurrentUser('id') userId: string) {
    return this.clansService.getClansForUser(userId);
  }

  @Get(':slug/stats')
  @ApiOperation({ summary: 'Get clan statistics' })
  async getStats(@Param('slug') slug: string, @CurrentUser('id') userId?: string) {
    const clan = await this.clansService.findBySlug(slug, userId);
    return this.clansService.getStats(clan.id);
  }

  @Get(':slug/dashboard')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get comprehensive clan dashboard' })
  async getDashboard(@Param('slug') slug: string, @CurrentUser('id') userId: string) {
    const clan = await this.clansService.findBySlug(slug, userId);
    return this.clansService.getDashboard(clan.id);
  }

  @Get(':slug/search')
  @ApiOperation({ summary: 'Search inside a clan' })
  async searchInsideClan(
    @Param('slug') slug: string,
    @Query('q') query: string,
    @CurrentUser('id') userId?: string,
  ) {
    const clan = await this.clansService.findBySlug(slug, userId);
    return this.clansService.searchInsideClan(clan.id, query || '');
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a clan by slug (public)' })
  async findBySlug(@Param('slug') slug: string, @CurrentUser('id') userId?: string) {
    return this.clansService.findBySlug(slug, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a clan' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateClanDto,
  ) {
    return this.clansService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a clan' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clansService.remove(id, userId);
  }

  @Post(':id/admins')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add admin to a clan' })
  async addAdmin(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: { userId: string; role: string },
  ) {
    return this.clansService.addAdmin(id, userId, dto);
  }

  @Get(':id/admins')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get clan admins' })
  async getAdmins(@Param('id') id: string) {
    return this.clansService.getAdmins(id);
  }

  @Patch(':id/admins/:adminId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update clan admin role' })
  async updateAdmin(
    @Param('id') id: string,
    @Param('adminId') adminId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: { role: string },
  ) {
    return this.clansService.updateAdmin(id, userId, adminId, dto);
  }

  @Delete(':id/admins/:adminId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove clan admin' })
  async removeAdmin(
    @Param('id') id: string,
    @Param('adminId') adminId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.clansService.removeAdmin(id, userId, adminId);
  }

  @Post(':id/join')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a family to a clan' })
  async joinFamily(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('familyId') familyId: string,
  ) {
    return this.clansService.joinFamily(id, familyId, userId);
  }

  @Post(':id/leave')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a family from a clan' })
  async leaveFamily(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('familyId') familyId: string,
  ) {
    return this.clansService.leaveFamily(id, familyId, userId);
  }
}
