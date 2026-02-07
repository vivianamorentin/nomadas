import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { User } from '../identity/decorators/user.decorator';
import { NotificationService } from './services/notification.service';
import { NotificationPreferenceService } from './services/notification-preference.service';
import {
  SendNotificationDto,
  UpdateNotificationPreferencesDto,
  MarkReadDto,
  QueryNotificationsDto,
} from './dto';
import { NotificationType } from '@prisma/client';

/**
 * Notification Controller
 * API endpoints for notification management
 * SPEC-NOT-001
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  /**
   * Get user notifications with pagination
   */
  @Get()
  async getUserNotifications(
    @User('id') userId: string,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationService.getUserNotifications(
      userId,
      query.page,
      query.limit,
      query.type,
      query.isRead,
    );
  }

  /**
   * Get notification by ID
   */
  @Get(':notificationId')
  async getNotification(
    @User('id') userId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.getNotification(notificationId, userId);
  }

  /**
   * Get unread count
   */
  @Get('unread/count')
  async getUnreadCount(@User('id') userId: string) {
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  /**
   * Mark notification as read
   */
  @Put(':notificationId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAsRead(
    @User('id') userId: string,
    @Param('notificationId') notificationId: string,
  ) {
    await this.notificationService.markAsRead(notificationId, userId);
  }

  /**
   * Mark all notifications as read
   */
  @Put('read/all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@User('id') userId: string) {
    await this.notificationService.markAllAsRead(userId);
  }

  /**
   * Delete notification (archive)
   */
  @Delete(':notificationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(
    @User('id') userId: string,
    @Param('notificationId') notificationId: string,
  ) {
    await this.notificationService.deleteNotification(notificationId, userId);
  }

  /**
   * Get user notification preferences
   */
  @Get('preferences/me')
  async getPreferences(@User('id') userId: string) {
    return this.preferenceService.getPreferences(userId);
  }

  /**
   * Update user notification preferences
   */
  @Put('preferences/me')
  async updatePreferences(
    @User('id') userId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.preferenceService.updatePreferences(userId, dto);
  }

  /**
   * Reset preferences to defaults
   */
  @Post('preferences/reset')
  async resetPreferences(@User('id') userId: string) {
    return this.preferenceService.resetToDefaults(userId);
  }

  /**
   * Send notification (internal API)
   * Used by other services to send notifications
   */
  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationService.send(dto);
  }

  /**
   * Unsubscribe from email (public endpoint for GDPR)
   */
  @Post('unsubscribe/email/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribeFromEmail(@Param('token') token: string) {
    await this.preferenceService.unsubscribeFromEmail(token);
  }

  /**
   * Unsubscribe from SMS (public endpoint for GDPR)
   */
  @Post('unsubscribe/sms/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribeFromSms(@Param('token') token: string) {
    await this.preferenceService.unsubscribeFromSms(token);
  }
}
