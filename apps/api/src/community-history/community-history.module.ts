import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { CommunityHistoryController } from './community-history.controller';
import { CommunityHistoryService } from './community-history.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CommunityHistoryController],
  providers: [CommunityHistoryService],
  exports: [CommunityHistoryService],
})
export class CommunityHistoryModule {}
