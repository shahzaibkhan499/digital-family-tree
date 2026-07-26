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
import { ClanLocationsService } from './clan-locations.service';
import { CreateClanLocationDto } from './dto/create-clan-location.dto';
import { UpdateClanLocationDto } from './dto/update-clan-location.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationService } from '../common/authorization.service';

@ApiTags('Clan Locations')
@Controller('clan-locations')
export class ClanLocationsController {
  constructor(
    private readonly clanLocationsService: ClanLocationsService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a clan location' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateClanLocationDto) {
    await this.authorizationService.requireClanOwnerOrAdmin(userId, dto.clanId);
    return this.clanLocationsService.create(dto);
  }

  @Get('clan/:clanId/distribution')
  @ApiOperation({ summary: 'Get location distribution for a clan' })
  async getDistribution(@Param('clanId') clanId: string) {
    return this.clanLocationsService.getDistribution(clanId);
  }

  @Get('clan/:clanId')
  @ApiOperation({ summary: 'Get all locations for a clan' })
  async findAllByClan(
    @Param('clanId') clanId: string,
    @Query('type') type?: string,
  ) {
    return this.clanLocationsService.findAllByClan(clanId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a location by ID' })
  async findOne(@Param('id') id: string) {
    return this.clanLocationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a location' })
  async update(@Param('id') id: string, @Body() dto: UpdateClanLocationDto, @CurrentUser('id') userId: string) {
    return this.clanLocationsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a location' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clanLocationsService.delete(id, userId);
  }
}
