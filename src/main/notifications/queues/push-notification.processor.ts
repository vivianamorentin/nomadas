import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { TemplateEngineService } from '../services/template-engine.service';
import { PushService } from '../services/push.service';
import { DeviceTokenService } from '../services/device-token.service';
import { NotificationType, DeliveryStatus, DevicePlatform } from '@prisma/client';

/**
 * Push Notification Processor
 * Processes push notifications from queue
 * SPEC-NOT-001 Phase 5
 */
@Processor('push-notifications')
export class PushNotificationProcessor {
  private readonly logger = new Logger(PushNotificationProcessor.name);

  constructor(
    private readonly pushService: PushService,
    private readonly deviceTokenService: DeviceTokenService,
    private readonly prisma: PrismaService,
    private readonly templateEngine: TemplateEngineService,
  ) {}

  /**
   * Process push notification job
   */
  @Process('send-push')
  async handleSendPush(job: Job) {
    try {
      this.logger.log(`Processing push notification job ${job.id}`);

      const { notificationId, userId } = job.data;

      // Get notification details
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Check user preferences
      const preferences = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!preferences?.pushEnabled) {
        this.logger.log(`Push notifications disabled for user ${userId}`);
        return {
          success: true,
          skipped: true,
          reason: 'Push notifications disabled',
        };
      }

      // Render push template
      const template = await this.templateEngine.renderTemplate(
        notification.type as NotificationType,
        user.preferredLanguage || 'en',
        {
          userName: user.firstName || user.email,
          userEmail: user.email,
          userLanguage: user.preferredLanguage || 'en',
          ...notification.payload,
        },
      );

      // Get user's device tokens
      const tokens = await this.deviceTokenService.getActiveTokens(userId);

      if (tokens.length === 0) {
        this.logger.log(`No active device tokens for user ${userId}`);
        return {
          success: true,
          skipped: true,
          reason: 'No active device tokens',
        };
      }

      this.logger.debug(`Sending push to ${tokens.length} devices for user ${userId}`);

      // Group tokens by platform
      const iosTokens = tokens.filter(t => t.platform === DevicePlatform.IOS).map(t => t.token);
      const androidTokens = tokens.filter(t => t.platform === DevicePlatform.ANDROID).map(t => t.token);

      let successCount = 0;
      let failureCount = 0;
      const invalidTokens: string[] = [];

      // Send to iOS devices
      if (iosTokens.length > 0) {
        const iosResult = await this.pushService.sendMulticast({
          tokens: iosTokens,
          platform: DevicePlatform.IOS,
          title: template.pushTitle || 'Notification',
          body: template.pushBody || '',
          data: {
            notificationId,
            type: notification.type,
          },
        });

        successCount += iosResult.successCount;
        failureCount += iosResult.failureCount;
        invalidTokens.push(...iosResult.invalidTokens);
      }

      // Send to Android devices
      if (androidTokens.length > 0) {
        const androidResult = await this.pushService.sendMulticast({
          tokens: androidTokens,
          platform: DevicePlatform.ANDROID,
          title: template.pushTitle || 'Notification',
          body: template.pushBody || '',
          data: {
            notificationId,
            type: notification.type,
          },
        });

        successCount += androidResult.successCount;
        failureCount += androidResult.failureCount;
        invalidTokens.push(...androidResult.invalidTokens);
      }

      // Remove invalid tokens
      if (invalidTokens.length > 0) {
        await this.deviceTokenService.removeInvalidTokens(invalidTokens);
        this.logger.warn(`Removed ${invalidTokens.length} invalid tokens`);
      }

      // Update notification status
      if (successCount > 0) {
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: {
            pushStatus: DeliveryStatus.SENT,
            pushDeliveredAt: new Date(),
          },
        });
      } else if (failureCount > 0) {
        throw new Error('Failed to send push to all devices');
      }

      this.logger.log(`Push sent successfully: ${successCount} success, ${failureCount} failed`);

      return {
        success: true,
        notificationId,
        userId,
        successCount,
        failureCount,
      };
    } catch (error) {
      this.logger.error(`Error processing push notification job ${job.id}`, error);

      // Update notification status to failed
      try {
        await this.prisma.notification.update({
          where: { id: job.data.notificationId },
          data: {
            pushStatus: DeliveryStatus.FAILED,
            failureReason: error.message,
            retryCount: { increment: 1 },
          },
        });
      } catch (updateError) {
        this.logger.error('Error updating notification status', updateError);
      }

      throw error;
    }
  }

  /**
   * Handle job started event
   */
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
  }

  /**
   * Handle job completed event
   */
  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Completed job ${job.id} with result:`, result);
  }

  /**
   * Handle job failed event
   */
  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Failed job ${job.id}: ${error.message}`);
  }
}
