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
import { ClanDirectoryService } from './clan-directory.service';
import { CreateClanDirectoryDto } from './dto/create-clan-directory.dto';
import { UpdateClanDirectoryDto } from './dto/update-clan-directory.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationService } from '../common/authorization.service';

@ApiTags('Clan Directory')
@Controller('clan-directory')
export class ClanDirectoryController {
  constructor(
    private readonly clanDirectoryService: ClanDirectoryService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a clan directory' })
  async join(@CurrentUser('id') userId: string, @Body() dto: CreateClanDirectoryDto) {
    await this.authorizationService.requireClanOwnerOrAdmin(userId, dto.clanId);
    return this.clanDirectoryService.join(userId, dto.clanId);
  }

  @Get('clan/:clanId/stats')
  @ApiOperation({ summary: 'Get directory stats for a clan' })
  async getStats(@Param('clanId') clanId: string) {
    return this.clanDirectoryService.getStats(clanId);
  }

  @Get('clan/:clanId')
  @ApiOperation({ summary: 'Get all directory entries for a clan' })
  async findAllByClan(
    @Param('clanId') clanId: string,
    @Query('role') role?: string,
    @Query('verified') verified?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.clanDirectoryService.findAllByClan(clanId, role, verified, status, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a directory entry by ID' })
  async findOne(@Param('id') id: string) {
    return this.clanDirectoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a directory entry' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateClanDirectoryDto, @CurrentUser('id') userId: string) {
    return this.clanDirectoryService.updateRole(id, dto, userId);
  }

  @Patch(':id/verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a directory entry' })
  async verify(@Param('id') id: string, @CurrentUser('id') verifiedById: string) {
    return this.clanDirectoryService.verify(id, verifiedById);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove from directory' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clanDirectoryService.remove(id, userId);
  }
}
