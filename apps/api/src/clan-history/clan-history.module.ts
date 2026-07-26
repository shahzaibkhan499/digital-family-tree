import { Module } from '@nestjs/common';
import { ClanHistoryController } from './clan-history.controller';
import { ClanHistoryService } from './clan-history.service';

@Module({
  controllers: [ClanHistoryController],
  providers: [ClanHistoryService],
  exports: [ClanHistoryService],
})
export class ClanHistoryModule {}
