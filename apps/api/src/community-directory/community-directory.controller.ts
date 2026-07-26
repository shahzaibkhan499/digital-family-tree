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
import { CommunityDirectoryService } from './community-directory.service';
import { CreateCommunityDirectoryDto } from './dto/create-community-directory.dto';
import { UpdateCommunityDirectoryDto } from './dto/update-community-directory.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationService } from '../common/authorization.service';

@ApiTags('Community Directory')
@Controller('community-directory')
export class CommunityDirectoryController {
  constructor(
    private readonly communityDirectoryService: CommunityDirectoryService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a community directory' })
  async join(@CurrentUser('id') userId: string, @Body() dto: CreateCommunityDirectoryDto) {
    await this.authorizationService.requireCommunityOwnerOrAdmin(userId, dto.communityId);
    return this.communityDirectoryService.join(userId, dto.communityId);
  }

  @Get('community/:communityId/stats')
  @ApiOperation({ summary: 'Get directory stats for a community' })
  async getStats(@Param('communityId') communityId: string) {
    return this.communityDirectoryService.getStats(communityId);
  }

  @Get('community/:communityId')
  @ApiOperation({ summary: 'Get all directory entries for a community' })
  async findAllByCommunity(
    @Param('communityId') communityId: string,
    @Query('role') role?: string,
    @Query('verified') verified?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.communityDirectoryService.findAllByCommunity(communityId, role, verified, status, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a directory entry by ID' })
  async findOne(@Param('id') id: string) {
    return this.communityDirectoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a directory entry' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateCommunityDirectoryDto, @CurrentUser('id') userId: string) {
    return this.communityDirectoryService.updateRole(id, dto, userId);
  }

  @Patch(':id/verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a directory entry' })
  async verify(@Param('id') id: string, @CurrentUser('id') verifiedById: string) {
    return this.communityDirectoryService.verify(id, verifiedById);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove from directory' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.communityDirectoryService.remove(id, userId);
  }
}
