import { Controller, Get, Patch, Param, Query, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DuplicatesService } from './duplicates.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Duplicates')
@Controller('duplicates')
export class DuplicatesController {
  constructor(private readonly duplicatesService: DuplicatesService) {}

  @Get('detect')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run duplicate detection scan' })
  async detect(@CurrentUser('id') userId: string) {
    return this.duplicatesService.detectDuplicates(userId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List duplicate reports' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('minScore') minScore?: string,
  ) {
    return this.duplicatesService.getDuplicateReports(
      userId,
      status,
      minScore ? parseFloat(minScore) : undefined,
    );
  }

  @Get('family/:familyId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get duplicates for specific family' })
  async findByFamily(
    @Param('familyId') familyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.duplicatesService.getDuplicatesByFamily(familyId, userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get duplicate detail' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.duplicatesService.getDuplicateById(id, userId);
  }

  @Patch(':id/review')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review duplicate' })
  async review(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { action: 'APPROVED' | 'REJECTED' },
  ) {
    return this.duplicatesService.reviewDuplicate(id, userId, body.action);
  }
}
