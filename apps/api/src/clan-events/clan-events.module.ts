import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { ClanEventsController } from './clan-events.controller';
import { ClanEventsService } from './clan-events.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ClanEventsController],
  providers: [ClanEventsService],
  exports: [ClanEventsService],
})
export class ClanEventsModule {}
