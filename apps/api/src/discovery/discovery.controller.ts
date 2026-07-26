import { Controller, Get, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DiscoveryService } from './discovery.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get discovery recommendations for current user' })
  async getRecommendations(@CurrentUser('id') userId: string) {
    return this.discoveryService.discoverForUser(userId);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get discovery stats' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.discoveryService.getDiscoveryStats(userId);
  }

  @Patch(':id/viewed')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark recommendation as viewed' })
  async markViewed(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.discoveryService.markViewed(userId, id);
  }
}
