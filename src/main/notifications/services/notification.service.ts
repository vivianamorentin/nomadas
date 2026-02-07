import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { NotificationType, DeliveryStatus } from '@prisma/client';
import { CreateNotificationDto, SendNotificationDto, NotificationChannel } from '../dto';
import { NotificationSendResult } from '../interfaces/notification-channel.interface';
import { NotificationPreferenceService } from './notification-preference.service';
import { TemplateEngineService } from './template-engine.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Notification Service
 * Core notification logic for creating and sending notifications
 * SPEC-NOT-001 Phase 1
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly preferenceService: NotificationPreferenceService,
    private readonly templateEngine: TemplateEngineService,
  ) {}

  /**
   * Create and send notification
   * This is the main entry point for sending notifications
   */
  async send(dto: SendNotificationDto): Promise<NotificationSendResult> {
    try {
      this.logger.log(`Sending notification type=${dto.type} to user=${dto.userId}`);

      // Get user preferences
      const preferences = await this.preferenceService.getOrCreatePreferences(dto.userId);

      // Determine which channels to use
      const channels = dto.channels || await this.getEnabledChannels(preferences, dto.type);

      // Create notification record
      const notification = await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          type: dto.type,
          payload: dto.payload,
          jobId: uuidv4(), // Generate job ID for tracking
        },
      });

      this.logger.debug(`Created notification ${notification.id}`);

      // Send to each channel
      const results = await Promise.allSettled(
        channels.map(channel => this.sendToChannel(notification, channel))
      );

      // Process results
      const channelResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            channel: channels[index],
            success: false,
            error: result.reason?.message || 'Unknown error',
          };
        }
      });

      const anySuccess = channelResults.some(r => r.success);
      const allFailed = channelResults.every(r => !r.success);

      return {
        notificationId: notification.id,
        channels: channelResults,
        anySuccess,
        allFailed,
      };
    } catch (error) {
      this.logger.error(`Error sending notification`, error);
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string, userId: string) {
    return this.prisma.notification.findUnique({
      where: { id: notificationId },
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId: string, page = 1, limit = 20, type?: NotificationType, isRead?: boolean) {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Delete notification (archive)
   */
  async deleteNotification(notificationId: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  /**
   * Get enabled channels based on user preferences and notification type
   */
  private async getEnabledChannels(preferences: any, type: NotificationType): Promise<NotificationChannel[]> {
    const channels: NotificationChannel[] = [];

    // Check type-specific preferences
    const typePrefs = preferences.typePreferences?.[type] || {};

    // In-app notifications (always enabled unless explicitly disabled)
    if (preferences.inAppEnabled && typePrefs.inApp !== false) {
      channels.push(NotificationChannel.IN_APP);
    }

    // Email notifications
    if (preferences.emailEnabled && typePrefs.email !== false) {
      channels.push(NotificationChannel.EMAIL);
    }

    // Push notifications
    if (preferences.pushEnabled && typePrefs.push !== false) {
      channels.push(NotificationChannel.PUSH);
    }

    // SMS notifications (security events only)
    if (preferences.smsEnabled && typePrefs.sms !== false) {
      channels.push(NotificationChannel.SMS);
    }

    return channels;
  }

  /**
   * Send notification to specific channel
   * This queues the notification for background processing
   */
  private async sendToChannel(notification: any, channel: NotificationChannel) {
    try {
      this.logger.debug(`Sending notification ${notification.id} via ${channel}`);

      // Update delivery status
      const statusField = this.getChannelStatusField(channel);
      const deliveredAtField = this.getChannelDeliveredAtField(channel);

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          [statusField]: DeliveryStatus.PENDING,
        },
      });

      // TODO: Queue the notification for background processing
      // This will be implemented when we integrate with Bull queues

      return {
        channel,
        success: true,
        deliveredAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error sending notification via ${channel}`, error);

      // Update failure status
      const statusField = this.getChannelStatusField(channel);
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          [statusField]: DeliveryStatus.FAILED,
          failureReason: error.message,
          retryCount: { increment: 1 },
        },
      });

      return {
        channel,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get Prisma field name for channel status
   */
  private getChannelStatusField(channel: NotificationChannel): string {
    const fieldMap = {
      [NotificationChannel.IN_APP]: 'inAppStatus',
      [NotificationChannel.EMAIL]: 'emailStatus',
      [NotificationChannel.PUSH]: 'pushStatus',
      [NotificationChannel.SMS]: 'smsStatus',
    };
    return fieldMap[channel];
  }

  /**
   * Get Prisma field name for channel delivered at timestamp
   */
  private getChannelDeliveredAtField(channel: NotificationChannel): string {
    const fieldMap = {
      [NotificationChannel.IN_APP]: 'inAppDeliveredAt',
      [NotificationChannel.EMAIL]: 'emailDeliveredAt',
      [NotificationChannel.PUSH]: 'pushDeliveredAt',
      [NotificationChannel.SMS]: 'smsDeliveredAt',
    };
    return fieldMap[channel];
  }
}
