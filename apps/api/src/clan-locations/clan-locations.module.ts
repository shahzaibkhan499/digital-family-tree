import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { ClanLocationsController } from './clan-locations.controller';
import { ClanLocationsService } from './clan-locations.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ClanLocationsController],
  providers: [ClanLocationsService],
  exports: [ClanLocationsService],
})
export class ClanLocationsModule {}
