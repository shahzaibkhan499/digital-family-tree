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
import { CommunityHistoryService } from './community-history.service';
import { CreateCommunityHistoryDto } from './dto/create-community-history.dto';
import { UpdateCommunityHistoryDto } from './dto/update-community-history.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationService } from '../common/authorization.service';

@ApiTags('Community History')
@Controller('community-history')
export class CommunityHistoryController {
  constructor(
    private readonly communityHistoryService: CommunityHistoryService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a community history entry' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateCommunityHistoryDto) {
    await this.authorizationService.requireCommunityOwnerOrAdmin(userId, dto.communityId);
    return this.communityHistoryService.create(userId, dto);
  }

  @Get('community/:communityId')
  @ApiOperation({ summary: 'Get all history entries for a community' })
  async findAllByCommunity(
    @Param('communityId') communityId: string,
    @Query('type') type?: string,
    @Query('verified') verified?: string,
  ) {
    return this.communityHistoryService.findAllByCommunity(communityId, type, verified);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a history entry by ID' })
  async findOne(@Param('id') id: string) {
    return this.communityHistoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a history entry' })
  async update(@Param('id') id: string, @Body() dto: UpdateCommunityHistoryDto, @CurrentUser('id') userId: string) {
    return this.communityHistoryService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a history entry' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.communityHistoryService.delete(id, userId);
  }
}
