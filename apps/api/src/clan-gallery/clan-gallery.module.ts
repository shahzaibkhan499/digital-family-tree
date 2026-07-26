import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { ClanGalleryController } from './clan-gallery.controller';
import { ClanGalleryService } from './clan-gallery.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ClanGalleryController],
  providers: [ClanGalleryService],
  exports: [ClanGalleryService],
})
export class ClanGalleryModule {}
