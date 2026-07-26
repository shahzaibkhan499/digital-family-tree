import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { CommunityLocationsController } from './community-locations.controller';
import { CommunityLocationsService } from './community-locations.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CommunityLocationsController],
  providers: [CommunityLocationsService],
  exports: [CommunityLocationsService],
})
export class CommunityLocationsModule {}
