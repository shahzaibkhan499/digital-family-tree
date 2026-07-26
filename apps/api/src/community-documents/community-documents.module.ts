import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { CommunityDocumentsController } from './community-documents.controller';
import { CommunityDocumentsService } from './community-documents.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CommunityDocumentsController],
  providers: [CommunityDocumentsService],
  exports: [CommunityDocumentsService],
})
export class CommunityDocumentsModule {}
