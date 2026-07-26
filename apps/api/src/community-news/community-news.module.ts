import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { CommunityNewsController } from './community-news.controller';
import { CommunityNewsService } from './community-news.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CommunityNewsController],
  providers: [CommunityNewsService],
  exports: [CommunityNewsService],
})
export class CommunityNewsModule {}
