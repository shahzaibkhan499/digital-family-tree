import { Module } from '@nestjs/common';
import { SubClansController } from './subclans.controller';
import { SubClansService } from './subclans.service';

@Module({
  controllers: [SubClansController],
  providers: [SubClansService],
  exports: [SubClansService],
})
export class SubClansModule {}
