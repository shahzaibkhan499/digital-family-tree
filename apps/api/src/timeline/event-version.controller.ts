import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventVersionService } from './event-version.service';
import { EventTemplateService } from './event-template.service';
import { EventActivityService } from './event-activity.service';

@Controller('timeline')
export class EventVersionController {
  constructor(
    private readonly eventVersionService: EventVersionService,
    private readonly eventTemplateService: EventTemplateService,
    private readonly eventActivityService: EventActivityService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('templates')
  getAllTemplates() {
    return this.eventTemplateService.getAllTemplates();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('templates/:eventType')
  getTemplate(@Param('eventType') eventType: string) {
    return this.eventTemplateService.getTemplate(eventType);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('feed')
  getUserActivityFeed(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.eventActivityService.getUserActivityFeed(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/versions')
  getVersions(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.eventVersionService.getVersions(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/versions/compare')
  compareVersions(
    @Param('id') id: string,
    @Query('a') versionIdA: string,
    @Query('b') versionIdB: string,
  ) {
    return this.eventVersionService.compareVersions(versionIdA, versionIdB);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/versions/:versionId')
  getVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.eventVersionService.getVersion(versionId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/versions')
  saveVersion(
    @Param('id') id: string,
    @Body() body: { data?: Record<string, unknown>; changeSummary?: string; isRollback?: boolean },
    @Req() req: any,
  ) {
    return this.eventVersionService.saveVersion(
      id,
      body.data || {},
      req.user.id,
      body.changeSummary,
      body.isRollback,
    );
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
  @Get('activity/stats')
  getActivityStats(@Query('familyId') familyId?: string) {
    return this.eventActivityService.getActivityStats(familyId);
  }
}
