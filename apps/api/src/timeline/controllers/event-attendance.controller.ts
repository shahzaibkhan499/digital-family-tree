import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventAttendanceService } from '../services/event-attendance.service';

@Controller('api/timeline/events/:eventId/attendance')
@UseGuards(AuthGuard('jwt'))
export class EventAttendanceController {
  constructor(private attendanceService: EventAttendanceService) {}

  @Get()
  async getAttendance(@Param('eventId') eventId: string) {
    return this.attendanceService.getAttendance(eventId);
  }

  @Post('check-in')
  async checkIn(@Param('eventId') eventId: string, @Request() req: any, @Body() body: { method?: string; location?: any }) {
    return this.attendanceService.checkIn(eventId, req.user.id, body.method, body.location);
  }

  @Post('check-out')
  async checkOut(@Param('eventId') eventId: string, @Request() req: any) {
    return this.attendanceService.checkOut(eventId, req.user.id);
  }

  @Post('verify')
  async verify(@Param('eventId') eventId: string, @Body() body: { userId: string }, @Request() req: any) {
    return this.attendanceService.verifyAttendance(eventId, body.userId, req.user.id);
  }

  @Get('stats')
  async getStats(@Param('eventId') eventId: string) {
    return this.attendanceService.getStats(eventId);
  }

  @Post('qr/:userId')
  async generateQr(@Param('eventId') eventId: string, @Param('userId') userId: string) {
    return this.attendanceService.generateQrCode(eventId, userId);
  }
}
