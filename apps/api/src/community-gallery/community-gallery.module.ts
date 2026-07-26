import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { CommunityGalleryController } from './community-gallery.controller';
import { CommunityGalleryService } from './community-gallery.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CommunityGalleryController],
  providers: [CommunityGalleryService],
  exports: [CommunityGalleryService],
})
export class CommunityGalleryModule {}
