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
import { ClanDocumentsService } from './clan-documents.service';
import { CreateClanDocumentDto } from './dto/create-clan-document.dto';
import { UpdateClanDocumentDto } from './dto/update-clan-document.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorizationService } from '../common/authorization.service';

@ApiTags('Clan Documents')
@Controller('clan-documents')
export class ClanDocumentsController {
  constructor(
    private readonly clanDocumentsService: ClanDocumentsService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a clan document' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateClanDocumentDto) {
    await this.authorizationService.requireClanOwnerOrAdmin(userId, dto.clanId);
    return this.clanDocumentsService.create(userId, dto);
  }

  @Get('clan/:clanId')
  @ApiOperation({ summary: 'Get all documents for a clan' })
  async findAllByClan(
    @Param('clanId') clanId: string,
    @Query('type') type?: string,
    @Query('verified') verified?: string,
    @Query('status') status?: string,
  ) {
    return this.clanDocumentsService.findAllByClan(clanId, type, verified, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  async findOne(@Param('id') id: string) {
    return this.clanDocumentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a document' })
  async update(@Param('id') id: string, @Body() dto: UpdateClanDocumentDto, @CurrentUser('id') userId: string) {
    return this.clanDocumentsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a document' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clanDocumentsService.delete(id, userId);
  }
}
