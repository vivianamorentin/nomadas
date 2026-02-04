import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  async getMyNotifications(@Request() req) {
    return this.notificationsService.findByUserId(req.user.userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(@Request() req, @Body() preferences: any) {
    return this.notificationsService.updatePreferences(req.user.userId, preferences);
  }
}
