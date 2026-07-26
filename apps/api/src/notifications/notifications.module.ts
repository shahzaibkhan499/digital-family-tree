import { Module, Global } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsEventService } from './notifications-event.service';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsEventService],
  exports: [NotificationsService, NotificationsEventService],
})
export class NotificationsModule {}
