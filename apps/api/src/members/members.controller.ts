import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Members')
@Controller('families/:familyId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a member to a family' })
  async create(
    @Param('familyId') familyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMemberDto,
  ) {
    return this.membersService.create(familyId, userId, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all members in a family' })
  async findAll(@Param('familyId') familyId: string, @CurrentUser('id') userId: string) {
    return this.membersService.findAll(familyId, userId);
  }

  @Post('check-duplicate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check for duplicate members within family' })
  async checkDuplicate(
    @Param('familyId') familyId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { firstName: string; lastName: string; birthDate?: string },
  ) {
    return this.membersService.checkDuplicate(familyId, body.firstName, body.lastName, body.birthDate);
  }

  @Post('check-global-duplicate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check for duplicates across all families' })
  async checkGlobalDuplicate(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMemberDto,
  ) {
    return this.membersService.checkGlobalDuplicate(dto);
  }

  @Get('smart-invite')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Smart invite search by name, email, or phone' })
  async smartInvite(
    @Param('familyId') familyId: string,
    @Query('query') query: string,
  ) {
    return this.membersService.smartInviteSearch(familyId, query || '');
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a member by ID' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.membersService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a member' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a member' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.membersService.remove(id, userId);
  }
}
