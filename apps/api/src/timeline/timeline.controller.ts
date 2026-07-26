import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, Header, Res, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminApiKeyGuard } from '../auth/guards/admin-api-key.guard';
import { TimelineService } from './timeline.service';
import { EventVersionService } from './event-version.service';
import { PrintExportService } from './services/print-export.service';
import {
  CreateTimelineEventDto, UpdateTimelineEventDto, RsvpDto,
  CreateCommentDto, UpdateCommentDto, CreateReactionDto,
  CreateEventDocumentDto, CreateEventReminderDto,
} from './dto/create-timeline-event.dto';

@Controller('timeline')
export class TimelineController {
  constructor(
    private timelineService: TimelineService,
    private eventVersionService: EventVersionService,
    private printExportService: PrintExportService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() dto: CreateTimelineEventDto, @Req() req: any) {
    return this.timelineService.create(dto, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('draft')
  saveDraft(@Body() dto: CreateTimelineEventDto, @Req() req: any) {
    return this.timelineService.saveDraft(dto, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('drafts')
  getDrafts(@Query('familyId') familyId?: string, @Req() req?: any) {
    return this.timelineService.getDrafts(req.user?.id, familyId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('search')
  searchEvents(@Query('q') q: string, @Query('page') page?: string, @Query('limit') limit?: string, @Req() req?: any) {
    return this.timelineService.searchEvents(req.user?.id, q, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @Header('Cache-Control', 'private, max-age=60')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('familyId') familyId?: string,
    @Query('memberId') memberId?: string,
    @Query('eventType') eventType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('venue') venue?: string,
    @Query('color') color?: string,
    @Query('createdById') createdById?: string,
    @Query('visibility') visibility?: string,
    @Query('cursor') cursor?: string,
    @Req() req?: any,
  ) {
    return this.timelineService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      familyId, memberId, eventType, dateFrom, dateTo, search, status, venue, color, createdById,
      userId: req?.user?.id,
      visibility,
      cursor,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('stats')
  getStats() {
    return this.timelineService.getStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('upcoming')
  getUpcomingEvents(@Req() req: any) {
    return this.timelineService.getUpcomingEvents(req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('today')
  getTodayEvents(@Req() req: any) {
    return this.timelineService.getTodayEvents(req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('recent')
  getRecentEvents(@Req() req: any) {
    return this.timelineService.getRecentEvents(req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('birthdays')
  getBirthdayEvents(@Req() req: any) {
    return this.timelineService.getBirthdayEvents(req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('anniversaries')
  getAnniversaryEvents(@Req() req: any) {
    return this.timelineService.getAnniversaryEvents(req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('widget')
  getUpcomingWidget(@Req() req: any) {
    return this.timelineService.getUpcomingWidget(req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('calendar')
  getCalendarEvents(
    @Req() req: any,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const now = new Date();
    return this.timelineService.getCalendarEvents(
      req.user?.id,
      year ? parseInt(year, 10) : now.getFullYear(),
      month ? parseInt(month, 10) : now.getMonth() + 1,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('calendar/week')
  getCalendarWeek(
    @Req() req: any,
    @Query('startDate') startDate?: string,
  ) {
    return this.timelineService.getCalendarWeek(
      req.user?.id,
      startDate || new Date().toISOString().split('T')[0],
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('agenda')
  getAgendaEvents(
    @Req() req: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return this.timelineService.getAgendaEvents(
      req.user?.id,
      dateFrom || startOfMonth,
      dateTo || endOfMonth,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('family/:familyId')
  findByFamily(
    @Param('familyId') familyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('eventType') eventType?: string,
    @Query('status') status?: string,
    @Query('venue') venue?: string,
    @Query('color') color?: string,
    @Query('createdById') createdById?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @Req() req?: any,
  ) {
    return this.timelineService.findByFamily(familyId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      eventType, status, venue, color, createdById, dateFrom, dateTo, search,
      userId: req?.user?.id,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('member/:memberId')
  findByMember(
    @Param('memberId') memberId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    return this.timelineService.findByMember(memberId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      userId: req?.user?.id,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @Header('Cache-Control', 'private, max-age=120')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.timelineService.findOne(id, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTimelineEventDto, @Req() req: any) {
    return this.timelineService.update(id, dto, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/cancel')
  cancelEvent(@Param('id') id: string, @Body('reason') reason?: string, @Req() req?: any) {
    return this.timelineService.cancelEvent(id, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/complete')
  completeEvent(@Param('id') id: string, @Req() req: any) {
    return this.timelineService.completeEvent(id, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/publish')
  publish(@Param('id') id: string, @Req() req: any) {
    return this.timelineService.publish(id, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/archive')
  archive(@Param('id') id: string, @Req() req: any) {
    return this.timelineService.archive(id, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/schedule')
  schedule(@Param('id') id: string, @Req() req: any) {
    return this.timelineService.schedule(id, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/pin')
  togglePin(@Param('id') id: string, @Req() req: any) {
    return this.timelineService.togglePin(id, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/feature')
  toggleFeature(@Param('id') id: string, @Req() req: any) {
    return this.timelineService.toggleFeature(id, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/duplicate')
  duplicateEvent(@Param('id') id: string, @Req() req: any) {
    return this.timelineService.duplicateEvent(id, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/rsvp')
  rsvp(@Param('id') id: string, @Body() dto: RsvpDto, @Req() req: any) {
    return this.timelineService.rsvp(id, req.user?.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/participants')
  getEventParticipants(@Param('id') id: string) {
    return this.timelineService.getEventParticipants(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/reminders')
  getEventReminders(@Param('id') id: string) {
    return this.timelineService.getEventReminders(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/reminders')
  createReminder(
    @Param('id') id: string,
    @Body() dto: CreateEventReminderDto,
    @Req() req: any,
  ) {
    return this.timelineService.createReminder(id, dto, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/tags')
  addTags(@Param('id') id: string, @Body() body: { tags: string[] }, @Req() req: any) {
    return this.timelineService.addTags(id, req.user?.id, body.tags);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/tags')
  removeTags(@Param('id') id: string, @Body() body: { tags: string[] }, @Req() req: any) {
    return this.timelineService.removeTags(id, req.user?.id, body.tags);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/keywords')
  addKeywords(@Param('id') id: string, @Body() body: { keywords: string[] }, @Req() req: any) {
    return this.timelineService.addKeywords(id, req.user?.id, body.keywords);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/keywords')
  removeKeywords(@Param('id') id: string, @Body() body: { keywords: string[] }, @Req() req: any) {
    return this.timelineService.removeKeywords(id, req.user?.id, body.keywords);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/reminders/:reminderId')
  deleteReminder(@Param('id') id: string, @Param('reminderId') reminderId: string, @Req() req: any) {
    return this.timelineService.deleteReminder(id, reminderId, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() dto: CreateCommentDto, @Req() req: any) {
    return this.timelineService.addComment(id, req.user?.id, dto.content, dto.parentId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/comments')
  getComments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timelineService.getComments(id, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('comments/:commentId')
  updateComment(@Param('commentId') commentId: string, @Body() dto: UpdateCommentDto, @Req() req: any) {
    return this.timelineService.updateComment(commentId, req.user?.id, dto.content);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('comments/:commentId')
  deleteComment(@Param('commentId') commentId: string, @Req() req: any) {
    return this.timelineService.deleteComment(commentId, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/reactions')
  addReaction(@Param('id') id: string, @Body() dto: CreateReactionDto, @Req() req: any) {
    return this.timelineService.addReaction(id, req.user?.id, dto.emoji);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/reactions')
  getReactions(@Param('id') id: string) {
    return this.timelineService.getReactions(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/documents')
  addDocument(@Param('id') id: string, @Body() dto: CreateEventDocumentDto, @Req() req: any) {
    return this.timelineService.addDocument(id, dto as any, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/documents')
  getDocuments(@Param('id') id: string) {
    return this.timelineService.getDocuments(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('documents/:docId')
  updateDocument(@Param('docId') docId: string, @Body() dto: any, @Req() req: any) {
    return this.timelineService.updateDocument(docId, dto, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('documents/:docId')
  removeDocument(@Param('docId') docId: string, @Req() req: any) {
    return this.timelineService.removeDocument(docId, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/activity')
  getActivity(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timelineService.getActivity(id, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/history')
  getHistory(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timelineService.getHistory(id, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('bulk-delete')
  bulkDelete(@Body() body: { ids: string[] }, @Req() req: any) {
    return this.timelineService.bulkDelete(body.ids, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('bulk-update-status')
  bulkUpdateStatus(@Body() body: { ids: string[]; status: string }, @Req() req: any) {
    return this.timelineService.bulkUpdateStatus(body.ids, body.status, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/export/json')
  async exportJson(@Param('id') id: string, @Res() res: any) {
    const data = await this.printExportService.exportAsJSON(id);
    res.json(data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/export/csv')
  async exportCsv(@Param('id') id: string, @Res() res: any) {
    const csv = await this.printExportService.exportCsv(id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="event-${id}.csv"`);
    res.send(csv);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/versions/:versionId/rollback')
  rollbackToVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Req() req: any,
  ) {
    return this.eventVersionService.rollbackToVersion(id, versionId, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.timelineService.remove(id, req.user?.id);
  }

  @UseGuards(AdminApiKeyGuard)
  @Delete('admin/:id')
  adminRemove(@Param('id') id: string) {
    return this.timelineService.remove(id, '', true);
  }
}
