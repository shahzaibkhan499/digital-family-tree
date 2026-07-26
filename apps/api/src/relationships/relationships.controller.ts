import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RelationshipsService } from './relationships.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Relationships')
@Controller()
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Post('relationships')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a relationship between two members' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRelationshipDto,
  ) {
    return this.relationshipsService.addRelationship(userId, dto);
  }

  @Get('families/:familyId/relationships')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all relationships in a family' })
  async listByFamily(
    @Param('familyId') familyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.relationshipsService.listByFamily(familyId, userId);
  }

  @Delete('relationships/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a relationship' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.relationshipsService.removeRelationship(id, userId);
  }
}
