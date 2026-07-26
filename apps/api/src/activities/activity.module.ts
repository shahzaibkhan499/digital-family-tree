import { Module, Global } from '@nestjs/common';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityEventService } from './activity-event.service';

@Global()
@Module({
  controllers: [ActivityController],
  providers: [ActivityService, ActivityEventService],
  exports: [ActivityService, ActivityEventService],
})
export class ActivityModule {}
