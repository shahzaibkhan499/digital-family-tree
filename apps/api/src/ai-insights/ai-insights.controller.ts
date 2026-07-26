import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AiInsightsService } from './ai-insights.service';
import { StoreCommunityInsightDto } from './dto/store-community-insight.dto';
import { StoreClanInsightDto } from './dto/store-clan-insight.dto';

@ApiTags('AI Insights')
@Controller('ai-insights')
export class AiInsightsController {
  constructor(private readonly aiInsightsService: AiInsightsService) {}

  @Get('community/:communityId')
  @ApiOperation({ summary: 'Get stored AI insights for a community' })
  async getCommunityInsights(@Param('communityId') communityId: string) {
    return this.aiInsightsService.getCommunityInsights(communityId);
  }

  @Get('clan/:clanId')
  @ApiOperation({ summary: 'Get stored AI insights for a clan' })
  async getClanInsights(@Param('clanId') clanId: string) {
    return this.aiInsightsService.getClanInsights(clanId);
  }

  @Post('community/:communityId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Store a new AI insight for a community' })
  async storeCommunityInsight(
    @Param('communityId') communityId: string,
    @Body() dto: StoreCommunityInsightDto,
  ) {
    return this.aiInsightsService.storeCommunityInsight(communityId, dto.type, dto.content);
  }

  @Post('clan/:clanId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Store a new AI insight for a clan' })
  async storeClanInsight(
    @Param('clanId') clanId: string,
    @Body() dto: StoreClanInsightDto,
  ) {
    return this.aiInsightsService.storeClanInsight(clanId, dto.type, dto.content);
  }
}
