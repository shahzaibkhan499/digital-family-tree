import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { ClanDocumentsController } from './clan-documents.controller';
import { ClanDocumentsService } from './clan-documents.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ClanDocumentsController],
  providers: [ClanDocumentsService],
  exports: [ClanDocumentsService],
})
export class ClanDocumentsModule {}
