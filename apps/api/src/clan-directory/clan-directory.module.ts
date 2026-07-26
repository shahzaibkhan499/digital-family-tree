import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { ClanDirectoryController } from './clan-directory.controller';
import { ClanDirectoryService } from './clan-directory.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ClanDirectoryController],
  providers: [ClanDirectoryService],
  exports: [ClanDirectoryService],
})
export class ClanDirectoryModule {}
