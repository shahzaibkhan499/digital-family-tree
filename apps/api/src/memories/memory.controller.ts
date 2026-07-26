import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminApiKeyGuard } from '../auth/guards/admin-api-key.guard';
import { MemoryService } from './memory.service';
import { CreateMemoryDto, UpdateMemoryDto, CreateMemoryCommentDto, CreateMemoryReactionDto } from './dto/create-memory.dto';

@Controller('memories')
export class MemoryController {
  constructor(private memoryService: MemoryService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateMemoryDto) {
    return this.memoryService.create(req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('familyId') familyId?: string,
    @Query('memberId') memberId?: string,
    @Query('tag') tag?: string,
    @Query('location') location?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Req() req?: any,
  ) {
    return this.memoryService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search, familyId, memberId, tag, location, dateFrom, dateTo, sortBy, sortOrder,
      viewerId: req?.user?.id,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('stats')
  getStats() {
    return this.memoryService.getStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('family/:familyId')
  findByFamily(
    @Param('familyId') familyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.memoryService.findByFamily(familyId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      sortBy, sortOrder,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('member/:memberId')
  findByMember(
    @Param('memberId') memberId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.memoryService.findByMember(memberId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.memoryService.findOne(id, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Req() req: { user: { id: string } }, @Body() dto: UpdateMemoryDto) {
    return this.memoryService.update(id, req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.memoryService.remove(id, req.user.id);
  }

  @UseGuards(AdminApiKeyGuard)
  @Delete('admin/:id')
  adminRemove(@Param('id') id: string) {
    return this.memoryService.remove(id, '', true);
  }

  @UseGuards(AdminApiKeyGuard)
  @Patch('admin/:id/hide')
  adminHide(@Param('id') id: string) {
    return this.memoryService.hide(id);
  }

  @UseGuards(AdminApiKeyGuard)
  @Patch('admin/:id/restore')
  adminRestore(@Param('id') id: string) {
    return this.memoryService.restore(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/comments')
  addComment(@Param('id') id: string, @Req() req: { user: { id: string } }, @Body() dto: CreateMemoryCommentDto) {
    return this.memoryService.addComment(id, req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':memoryId/comments/:commentId')
  removeComment(@Param('memoryId') memoryId: string, @Param('commentId') commentId: string, @Req() req: { user: { id: string } }) {
    return this.memoryService.removeComment(memoryId, commentId, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/reactions')
  toggleReaction(@Param('id') id: string, @Req() req: { user: { id: string } }, @Body() dto: CreateMemoryReactionDto) {
    return this.memoryService.toggleReaction(id, req.user.id, dto);
  }
}
