import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventInvitationsService } from './event-invitations.service';
import { CreateEventInvitationDto } from './dto/create-event-invitation.dto';

@Controller('event-invitations')
export class EventInvitationsController {
  constructor(private readonly eventInvitationsService: EventInvitationsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  createInvitations(@Req() req: any, @Body() dto: CreateEventInvitationDto) {
    return this.eventInvitationsService.createInvitations(req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('event/:eventId')
  getEventInvitations(@Param('eventId') eventId: string) {
    return this.eventInvitationsService.getEventInvitations(eventId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('event/:eventId/stats')
  getInvitationStats(@Param('eventId') eventId: string) {
    return this.eventInvitationsService.getInvitationStats(eventId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('mine')
  getMyInvitations(@Req() req: any) {
    return this.eventInvitationsService.getMyInvitations(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/respond')
  respondToInvitation(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.eventInvitationsService.respondToInvitation(req.user.id, id, status);
  }
}
