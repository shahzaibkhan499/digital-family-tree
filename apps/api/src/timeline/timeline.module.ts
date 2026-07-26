import { Module } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';
import { EventVersionService } from './event-version.service';
import { EventTemplateService } from './event-template.service';
import { EventActivityService } from './event-activity.service';
import { EventVersionController } from './event-version.controller';
import { BirthInformationService } from './services/birth-information.service';
import { MarriageInformationService } from './services/marriage-information.service';
import { DeathInformationService } from './services/death-information.service';
import { EducationInformationService } from './services/education-information.service';
import { EmploymentInformationService } from './services/employment-information.service';
import { MigrationInformationService } from './services/migration-information.service';
import { MilitaryInformationService } from './services/military-information.service';
import { AwardInformationService } from './services/award-information.service';
import { BusinessInformationService } from './services/business-information.service';
import { EventSummaryService } from './services/event-summary.service';
import { NotificationEngineService } from './services/notification-engine.service';
import { PrintExportService } from './services/print-export.service';
import { EventInfoController } from './controllers/event-info.controller';
import { EventAttendanceService } from './services/event-attendance.service';
import { EventAttendanceController } from './controllers/event-attendance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  providers: [
    TimelineService,
    EventVersionService,
    EventTemplateService,
    EventActivityService,
    BirthInformationService,
    MarriageInformationService,
    DeathInformationService,
    EducationInformationService,
    EmploymentInformationService,
    MigrationInformationService,
    MilitaryInformationService,
    AwardInformationService,
    BusinessInformationService,
    EventSummaryService,
    NotificationEngineService,
    PrintExportService,
    EventAttendanceService,
  ],
  controllers: [TimelineController, EventVersionController, EventInfoController, EventAttendanceController],
  exports: [
    TimelineService,
    EventVersionService,
    EventTemplateService,
    EventActivityService,
    BirthInformationService,
    MarriageInformationService,
    DeathInformationService,
    EducationInformationService,
    EmploymentInformationService,
    MigrationInformationService,
    MilitaryInformationService,
    AwardInformationService,
    BusinessInformationService,
    EventSummaryService,
    NotificationEngineService,
    PrintExportService,
  ],
})
export class TimelineModule {}
