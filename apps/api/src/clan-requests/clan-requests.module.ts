import { Module } from '@nestjs/common';
import { ClanRequestsController } from './clan-requests.controller';
import { ClanRequestsService } from './clan-requests.service';

@Module({
  controllers: [ClanRequestsController],
  providers: [ClanRequestsService],
  exports: [ClanRequestsService],
})
export class ClanRequestsModule {}
