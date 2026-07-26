import { Controller, Get, Post, Patch, Param, Query, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MergeService } from './merge.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Family Merge')
@Controller('merge')
export class MergeController {
  constructor(private readonly mergeService: MergeService) {}

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get merge history' })
  async getHistory(@CurrentUser('id') userId: string) {
    return this.mergeService.getMergeHistory(userId);
  }

  @Get('history/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get merge snapshot detail' })
  async getSnapshot(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.mergeService.getMergeSnapshot(id, userId);
  }

  @Get('preview')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get merge preview between two members' })
  async getPreview(
    @CurrentUser('id') userId: string,
    @Query('sourceMemberId') sourceMemberId: string,
    @Query('targetMemberId') targetMemberId: string,
  ) {
    return this.mergeService.getMergePreview(userId, sourceMemberId, targetMemberId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List merge requests for user families' })
  async list(@CurrentUser('id') userId: string) {
    return this.mergeService.listMergeRequests(userId);
  }

  @Post('request')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a merge request between two families' })
  async createRequest(
    @CurrentUser('id') userId: string,
    @Body() body: { sourceFamilyId: string; targetFamilyId: string },
  ) {
    return this.mergeService.createMergeRequest(userId, body.sourceFamilyId, body.targetFamilyId);
  }

  @Post('execute')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute a member merge' })
  async executeMerge(
    @CurrentUser('id') userId: string,
    @Body() body: { sourceMemberId: string; targetMemberId: string; strategy: 'KEEP_LEFT' | 'KEEP_RIGHT' | 'MERGE_BOTH' },
  ) {
    return this.mergeService.executeMerge(userId, body.sourceMemberId, body.targetMemberId, body.strategy);
  }

  @Post(':snapshotId/undo')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Undo a merge using snapshot' })
  async undoMerge(
    @Param('snapshotId') snapshotId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.mergeService.undoMerge(userId, snapshotId);
  }

  @Patch(':id/approve')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a merge request' })
  async approve(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.mergeService.approveMergeRequest(userId, id);
  }

  @Patch(':id/reject')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a merge request' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.mergeService.rejectMergeRequest(userId, id);
  }

  @Get(':id/audit')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get audit log for a merge request' })
  async auditLog(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.mergeService.getMergeAuditLog(id, userId);
  }
}
