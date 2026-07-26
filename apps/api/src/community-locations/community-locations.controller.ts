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
import { CommunityLocationsService } from './community-locations.service';
import { CreateCommunityLocationDto } from './dto/create-community-location.dto';
import { UpdateCommunityLocationDto } from './dto/update-community-location.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationService } from '../common/authorization.service';

@ApiTags('Community Locations')
@Controller('community-locations')
export class CommunityLocationsController {
  constructor(
    private readonly communityLocationsService: CommunityLocationsService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a community location' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateCommunityLocationDto) {
    await this.authorizationService.requireCommunityOwnerOrAdmin(userId, dto.communityId);
    return this.communityLocationsService.create(dto);
  }

  @Get('community/:communityId/distribution')
  @ApiOperation({ summary: 'Get location distribution for a community' })
  async getDistribution(@Param('communityId') communityId: string) {
    return this.communityLocationsService.getDistribution(communityId);
  }

  @Get('community/:communityId')
  @ApiOperation({ summary: 'Get all locations for a community' })
  async findAllByCommunity(
    @Param('communityId') communityId: string,
    @Query('type') type?: string,
  ) {
    return this.communityLocationsService.findAllByCommunity(communityId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a location by ID' })
  async findOne(@Param('id') id: string) {
    return this.communityLocationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a location' })
  async update(@Param('id') id: string, @Body() dto: UpdateCommunityLocationDto, @CurrentUser('id') userId: string) {
    return this.communityLocationsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a location' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.communityLocationsService.delete(id, userId);
  }
}
