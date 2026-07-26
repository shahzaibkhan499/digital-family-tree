import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { CommunityDirectoryController } from './community-directory.controller';
import { CommunityDirectoryService } from './community-directory.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CommunityDirectoryController],
  providers: [CommunityDirectoryService],
  exports: [CommunityDirectoryService],
})
export class CommunityDirectoryModule {}
