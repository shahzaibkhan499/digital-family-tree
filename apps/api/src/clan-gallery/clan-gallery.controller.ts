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
import { ClanGalleryService } from './clan-gallery.service';
import { CreateClanGalleryDto } from './dto/create-clan-gallery.dto';
import { UpdateClanGalleryDto } from './dto/update-clan-gallery.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationService } from '../common/authorization.service';

@ApiTags('Clan Gallery')
@Controller('clan-gallery')
export class ClanGalleryController {
  constructor(
    private readonly clanGalleryService: ClanGalleryService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload to clan gallery' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateClanGalleryDto) {
    await this.authorizationService.requireClanOwnerOrAdmin(userId, dto.clanId);
    return this.clanGalleryService.create(userId, dto);
  }

  @Get('clan/:clanId')
  @ApiOperation({ summary: 'Get all gallery items for a clan' })
  async findAllByClan(
    @Param('clanId') clanId: string,
    @Query('type') type?: string,
    @Query('verified') verified?: string,
  ) {
    return this.clanGalleryService.findAllByClan(clanId, type, verified);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a gallery item by ID' })
  async findOne(@Param('id') id: string) {
    return this.clanGalleryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a gallery item' })
  async update(@Param('id') id: string, @Body() dto: UpdateClanGalleryDto, @CurrentUser('id') userId: string) {
    return this.clanGalleryService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a gallery item' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clanGalleryService.delete(id, userId);
  }
}
