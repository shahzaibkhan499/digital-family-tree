import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { CommunityEventsController } from './community-events.controller';
import { CommunityEventsService } from './community-events.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CommunityEventsController],
  providers: [CommunityEventsService],
  exports: [CommunityEventsService],
})
export class CommunityEventsModule {}
