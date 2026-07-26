import { Module } from '@nestjs/common';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';
import { MembersModule } from '../members/members.module';
import { TimelineModule } from '../timeline/timeline.module';
import { TreeModule } from '../tree/tree.module';

@Module({
  imports: [MembersModule, TimelineModule, TreeModule],
  controllers: [FamiliesController],
  providers: [FamiliesService],
})
export class FamiliesModule {}
