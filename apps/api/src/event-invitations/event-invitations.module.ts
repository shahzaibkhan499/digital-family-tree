import { Module } from '@nestjs/common';
import { EventInvitationsService } from './event-invitations.service';
import { EventInvitationsController } from './event-invitations.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [EventInvitationsService],
  controllers: [EventInvitationsController],
  exports: [EventInvitationsService],
})
export class EventInvitationsModule {}
