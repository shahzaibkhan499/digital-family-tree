import { Controller, Get, Put, Post, Body, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BirthInformationService } from '../services/birth-information.service';
import { MarriageInformationService } from '../services/marriage-information.service';
import { DeathInformationService } from '../services/death-information.service';
import { EducationInformationService } from '../services/education-information.service';
import { EmploymentInformationService } from '../services/employment-information.service';
import { MigrationInformationService } from '../services/migration-information.service';
import { MilitaryInformationService } from '../services/military-information.service';
import { AwardInformationService } from '../services/award-information.service';
import { BusinessInformationService } from '../services/business-information.service';
import { EventSummaryService } from '../services/event-summary.service';
import { PrintExportService } from '../services/print-export.service';

@Controller('timeline')
export class EventInfoController {
  constructor(
    private birthInfo: BirthInformationService,
    private marriageInfo: MarriageInformationService,
    private deathInfo: DeathInformationService,
    private educationInfo: EducationInformationService,
    private employmentInfo: EmploymentInformationService,
    private migrationInfo: MigrationInformationService,
    private militaryInfo: MilitaryInformationService,
    private awardInfo: AwardInformationService,
    private businessInfo: BusinessInformationService,
    private summaryService: EventSummaryService,
    private printService: PrintExportService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Put('events/:eventId/info')
  async upsertInfo(
    @Param('eventId') eventId: string,
    @Body() body: { eventType: string; data: any },
  ) {
    const { eventType, data } = body;
    switch (eventType) {
      case 'BIRTH': return this.birthInfo.upsert(eventId, data);
      case 'MARRIAGE': return this.marriageInfo.upsert(eventId, data);
      case 'DEATH': return this.deathInfo.upsert(eventId, data);
      case 'EDUCATION':
      case 'GRADUATION': return this.educationInfo.upsert(eventId, data);
      case 'JOB':
      case 'PROMOTION':
      case 'CAREER':
      case 'RETIREMENT': return this.employmentInfo.upsert(eventId, data);
      case 'MIGRATION': return this.migrationInfo.upsert(eventId, data);
      case 'MILITARY_SERVICE': return this.militaryInfo.upsert(eventId, data);
      case 'AWARD': return this.awardInfo.upsert(eventId, data);
      case 'BUSINESS': return this.businessInfo.upsert(eventId, data);
      default: throw new BadRequestException(`Unsupported event type: ${eventType}`);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('events/:eventId/info')
  async getInfo(
    @Param('eventId') eventId: string,
    @Query('eventType') eventType?: string,
  ) {
    const evType = eventType || '';
    switch (evType) {
      case 'BIRTH': return this.birthInfo.getByEventId(eventId);
      case 'MARRIAGE': return this.marriageInfo.getByEventId(eventId);
      case 'DEATH': return this.deathInfo.getByEventId(eventId);
      case 'EDUCATION':
      case 'GRADUATION': return this.educationInfo.getByEventId(eventId);
      case 'JOB':
      case 'PROMOTION':
      case 'CAREER':
      case 'RETIREMENT': return this.employmentInfo.getByEventId(eventId);
      case 'MIGRATION': return this.migrationInfo.getByEventId(eventId);
      case 'MILITARY_SERVICE': return this.militaryInfo.getByEventId(eventId);
      case 'AWARD': return this.awardInfo.getByEventId(eventId);
      case 'BUSINESS': return this.businessInfo.getByEventId(eventId);
      default: return null;
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('events/:eventId/summary')
  async getSummary(@Param('eventId') eventId: string) {
    return this.summaryService.getSummary(eventId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('events/:eventId/summary/generate')
  async generateSummary(@Param('eventId') eventId: string) {
    return this.summaryService.generateSummary(eventId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('events/:eventId/summary')
  async updateSummary(
    @Param('eventId') eventId: string,
    @Body() body: { editedText: string },
    @Req() req: any,
  ) {
    return this.summaryService.updateSummary(eventId, body.editedText, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('events/:eventId/print')
  async getPrintVersion(@Param('eventId') eventId: string) {
    return this.printService.getPrintVersion(eventId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('events/:eventId/print/generate')
  async generatePrint(@Param('eventId') eventId: string, @Body() body: any) {
    return this.printService.generatePrintVersion(eventId, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('events/:eventId/export/json')
  async exportJSON(@Param('eventId') eventId: string) {
    return this.printService.exportAsJSON(eventId);
  }
}
