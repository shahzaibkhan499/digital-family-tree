import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BirthInformationService } from './birth-information.service';
import { MarriageInformationService } from './marriage-information.service';
import { DeathInformationService } from './death-information.service';
import { EducationInformationService } from './education-information.service';
import { EmploymentInformationService } from './employment-information.service';
import { MigrationInformationService } from './migration-information.service';
import { MilitaryInformationService } from './military-information.service';
import { AwardInformationService } from './award-information.service';
import { BusinessInformationService } from './business-information.service';

@Injectable()
export class EventSummaryService {
  constructor(
    private prisma: PrismaService,
    private birthInfo: BirthInformationService,
    private marriageInfo: MarriageInformationService,
    private deathInfo: DeathInformationService,
    private educationInfo: EducationInformationService,
    private employmentInfo: EmploymentInformationService,
    private migrationInfo: MigrationInformationService,
    private militaryInfo: MilitaryInformationService,
    private awardInfo: AwardInformationService,
    private businessInfo: BusinessInformationService,
  ) {}

  async generateSummary(eventId: string): Promise<string> {
    const event = await this.prisma.timelineEvent.findUnique({ where: { id: eventId } });
    if (!event) return '';

    let text = '';
    switch (event.eventType) {
      case 'BIRTH': text = await this.birthInfo.generateSummary(eventId); break;
      case 'MARRIAGE': text = await this.marriageInfo.generateSummary(eventId); break;
      case 'DEATH': text = await this.deathInfo.generateSummary(eventId); break;
      case 'EDUCATION':
      case 'GRADUATION': text = await this.educationInfo.generateSummary(eventId); break;
      case 'JOB':
      case 'PROMOTION':
      case 'CAREER':
      case 'RETIREMENT': text = await this.employmentInfo.generateSummary(eventId); break;
      case 'MIGRATION': text = await this.migrationInfo.generateSummary(eventId); break;
      case 'MILITARY_SERVICE': text = await this.militaryInfo.generateSummary(eventId); break;
      case 'AWARD': text = await this.awardInfo.generateSummary(eventId); break;
      case 'BUSINESS': text = await this.businessInfo.generateSummary(eventId); break;
      default: text = `${event.title}. ${event.description || ''}`.trim();
    }

    if (!text) return '';

    const existing = await this.prisma.eventSummary.findUnique({ where: { eventId } });
    if (existing) {
      return this.prisma.eventSummary.update({
        where: { eventId },
        data: { generatedText: text, version: existing.version + 1 },
      }).then(s => s.generatedText);
    }

    return this.prisma.eventSummary.create({
      data: { eventId, generatedText: text },
    }).then(s => s.generatedText);
  }

  async getSummary(eventId: string) {
    return this.prisma.eventSummary.findUnique({ where: { eventId } });
  }

  async updateSummary(eventId: string, editedText: string, userId: string) {
    return this.prisma.eventSummary.update({
      where: { eventId },
      data: { editedText, isEdited: true, editedById: userId },
    });
  }
}
