import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, CommonModule, UploadModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
