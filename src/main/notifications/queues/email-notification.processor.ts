import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { TemplateEngineService } from '../services/template-engine.service';
import { EmailService } from '../services/email.service';
import { NotificationType, DeliveryStatus } from '@prisma/client';

/**
 * Email Notification Processor
 * Processes email notifications from queue
 * SPEC-NOT-001 Phase 4
 */
@Processor('email-notifications')
export class EmailNotificationProcessor {
  private readonly logger = new Logger(EmailNotificationProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly templateEngine: TemplateEngineService,
  ) {}

  /**
   * Process email notification job
   */
  @Process('send-email')
  async handleSendEmail(job: Job) {
    try {
      this.logger.log(`Processing email notification job ${job.id}`);

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

      // Render email template
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

      // Get user's unsubscribe token
      const preferences = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });

      // Send email via EmailService
      const result = await this.emailService.sendEmail({
        to: user.email,
        subject: template.subject || 'Notification',
        html: template.htmlBody,
        text: template.textBody,
        unsubscribeToken: preferences?.emailUnsubscribeToken,
        metadata: {
          notificationId,
          type: notification.type,
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }

      // Update notification status
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          emailStatus: DeliveryStatus.SENT,
          emailDeliveredAt: new Date(),
          jobId: result.messageId,
        },
      });

      this.logger.log(`Email sent successfully to ${user.email}, messageId: ${result.messageId}`);

      return {
        success: true,
        notificationId,
        userId,
        email: user.email,
      };
    } catch (error) {
      this.logger.error(`Error processing email notification job ${job.id}`, error);

      // Update notification status to failed
      try {
        await this.prisma.notification.update({
          where: { id: job.data.notificationId },
          data: {
            emailStatus: DeliveryStatus.FAILED,
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
