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
import { FamiliesService } from './families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminApiKeyGuard } from '../auth/guards/admin-api-key.guard';
import { TreeService } from '../tree/tree.service';

@ApiTags('Families')
@Controller('families')
export class FamiliesController {
  constructor(
    private readonly familiesService: FamiliesService,
    private readonly treeService: TreeService,
  ) {}

  @Get('all')
  @UseGuards(AdminApiKeyGuard)
  @ApiOperation({ summary: 'List all families (admin only)' })
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.familiesService.findAllAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  @Get('limit')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get family creation limit info' })
  async getFamilyLimitInfo(@CurrentUser('id') userId: string) {
    return this.familiesService.getFamilyLimitInfo(userId);
  }

  @Get('search-member/:displayId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for a family member by display ID' })
  async searchMember(@Param('displayId') displayId: string) {
    const member = await this.familiesService.searchMemberByDisplayId(displayId);
    if (!member) {
      return { found: false };
    }
    return { found: true, member };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new family' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateFamilyDto) {
    return this.familiesService.create(userId, dto);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard stats for current user' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.familiesService.getStats(userId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all families for current user' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.familiesService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a family with all members' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.familiesService.findOne(id, userId);
  }

  @Get(':id/tree')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get family tree data' })
  async getTree(@Param('id') id: string) {
    return this.treeService.getFamilyTree(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a family' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateFamilyDto,
  ) {
    return this.familiesService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a family' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.familiesService.remove(id, userId);
  }
}
