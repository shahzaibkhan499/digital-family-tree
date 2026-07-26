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
import { SubClansService } from './subclans.service';
import { CreateSubClanDto } from './dto/create-subclan.dto';
import { UpdateSubClanDto } from './dto/update-subclan.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Sub-Clans')
@Controller()
export class SubClansController {
  constructor(private readonly subClansService: SubClansService) {}

  @Post('clans/:clanId/subclans')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new sub-clan under a clan' })
  async create(
    @CurrentUser('id') userId: string,
    @Param('clanId') clanId: string,
    @Body() dto: CreateSubClanDto,
  ) {
    return this.subClansService.create(userId, clanId, dto);
  }

  @Get('clans/:clanId/subclans')
  @ApiOperation({ summary: 'List sub-clans for a clan' })
  async findAll(
    @Param('clanId') clanId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.subClansService.findAll(
      clanId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  @Get('subclans/:slug/stats')
  @ApiOperation({ summary: 'Get sub-clan statistics' })
  async getStats(@Param('slug') slug: string) {
    return this.subClansService.getStats(slug);
  }

  @Get('subclans/:slug')
  @ApiOperation({ summary: 'Get a sub-clan by slug (public)' })
  async findBySlug(@Param('slug') slug: string, @CurrentUser('id') userId?: string) {
    return this.subClansService.findBySlug(slug, userId);
  }

  @Patch('subclans/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a sub-clan' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSubClanDto,
  ) {
    return this.subClansService.update(id, userId, dto);
  }

  @Get('subclans/:id/tree')
  @ApiOperation({ summary: 'Get the recursive sub-clan tree' })
  async getTree(@Param('id') id: string) {
    return this.subClansService.getTree(id);
  }

  @Get('subclans/:id/breadcrumbs')
  @ApiOperation({ summary: 'Get breadcrumbs from a sub-clan to the root' })
  async getBreadcrumbs(@Param('id') id: string) {
    return this.subClansService.getBreadcrumbs(id);
  }

  @Delete('subclans/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a sub-clan' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.subClansService.remove(id, userId);
  }
}
