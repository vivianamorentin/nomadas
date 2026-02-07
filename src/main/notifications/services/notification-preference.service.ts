import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { UpdateNotificationPreferencesDto } from '../dto';
import { EmailDigestFrequency } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Notification Preference Service
 * Manages user notification preferences
 * SPEC-NOT-001 Phase 1
 */
@Injectable()
export class NotificationPreferenceService {
  private readonly logger = new Logger(NotificationPreferenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user preferences or create with defaults
   */
  async getOrCreatePreferences(userId: string) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      this.logger.log(`Creating default preferences for user ${userId}`);
      preferences = await this.createDefaultPreferences(userId);
    }

    return preferences;
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string) {
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      throw new NotFoundException(`Notification preferences not found for user ${userId}`);
    }

    return preferences;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    this.logger.log(`Updating preferences for user ${userId}`);

    // Ensure preferences exist
    await this.getOrCreatePreferences(userId);

    // Merge with existing preferences
    const updated = await this.prisma.notificationPreference.update({
      where: { userId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    this.logger.debug(`Updated preferences for user ${userId}`);
    return updated;
  }

  /**
   * Reset preferences to defaults
   */
  async resetToDefaults(userId: string) {
    this.logger.log(`Resetting preferences to defaults for user ${userId}`);

    // Delete existing preferences
    await this.prisma.notificationPreference.delete({
      where: { userId },
    }).catch(() => {
      // Ignore if not found
    });

    // Create new defaults
    return this.createDefaultPreferences(userId);
  }

  /**
   * Unsubscribe from email notifications (GDPR)
   */
  async unsubscribeFromEmail(token: string) {
    this.logger.log(`Processing email unsubscribe with token ${token}`);

    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { emailUnsubscribeToken: token },
    });

    if (!preferences) {
      throw new NotFoundException('Invalid unsubscribe token');
    }

    return this.prisma.notificationPreference.update({
      where: { userId: preferences.userId },
      data: {
        emailEnabled: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Unsubscribe from SMS notifications (GDPR)
   */
  async unsubscribeFromSms(token: string) {
    this.logger.log(`Processing SMS unsubscribe with token ${token}`);

    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { smsUnsubscribeToken: token },
    });

    if (!preferences) {
      throw new NotFoundException('Invalid unsubscribe token');
    }

    return this.prisma.notificationPreference.update({
      where: { userId: preferences.userId },
      data: {
        smsEnabled: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Check if user has quiet hours active
   */
  async isQuietHoursActive(userId: string): Promise<boolean> {
    const preferences = await this.getOrCreatePreferences(userId);

    if (!preferences.quietHoursEnabled) {
      return false;
    }

    // Get current time in user's timezone
    const now = new Date();
    const userTime = this.convertToTimezone(now, preferences.quietHoursTimezone);
    const currentTime = this.formatTime(userTime);

    const start = preferences.quietHoursStart;
    const end = preferences.quietHoursEnd;

    // Check if current time is within quiet hours
    if (start && end) {
      return this.isTimeInRange(currentTime, start, end);
    }

    return false;
  }

  /**
   * Create default preferences for new user
   */
  private createDefaultPreferences(userId: string) {
    return this.prisma.notificationPreference.create({
      data: {
        userId,
        inAppEnabled: true,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false, // Security events only
        quietHoursEnabled: false,
        quietHoursTimezone: 'UTC',
        emailDigest: EmailDigestFrequency.IMMEDIATE,
        emailUnsubscribeToken: uuidv4(),
        smsUnsubscribeToken: uuidv4(),
        typePreferences: this.getDefaultTypePreferences(),
      },
    });
  }

  /**
   * Get default type-specific preferences
   */
  private getDefaultTypePreferences() {
    return {
      // Job application notifications - all channels
      JOB_APPLICATION_RECEIVED: {
        inApp: true,
        email: true,
        push: true,
        sms: false,
      },
      APPLICATION_STATUS_CHANGED: {
        inApp: true,
        email: true,
        push: true,
        sms: false,
      },
      APPLICATION_WITHDRAWN: {
        inApp: true,
        email: true,
        push: false,
        sms: false,
      },

      // Review notifications - all channels
      REVIEW_RECEIVED: {
        inApp: true,
        email: true,
        push: true,
        sms: false,
      },
      REVIEW_RESPONSE_RECEIVED: {
        inApp: true,
        email: true,
        push: true,
        sms: false,
      },

      // Message notifications - real-time
      NEW_MESSAGE: {
        inApp: true,
        email: false, // Will use digest
        push: true,
        sms: false,
      },
      MESSAGE_DIGEST: {
        inApp: false,
        email: true,
        push: false,
        sms: false,
      },

      // Job alerts - email and push
      JOB_ALERT: {
        inApp: true,
        email: true,
        push: true,
        sms: false,
      },

      // System notifications - varies by type
      JOB_EXPIRING_SOON: {
        inApp: true,
        email: true,
        push: false,
        sms: false,
      },
      VERIFICATION_STATUS_CHANGED: {
        inApp: true,
        email: true,
        push: true,
        sms: false,
      },
      SECURITY_ALERT: {
        inApp: true,
        email: true,
        push: false,
        sms: true, // SMS for security events
      },
      BADGE_EARNED: {
        inApp: true,
        email: false,
        push: true,
        sms: false,
      },
    };
  }

  /**
   * Convert date to timezone
   */
  private convertToTimezone(date: Date, timezone: string): Date {
    // Simple implementation - in production, use a library like luxon or date-fns-tz
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  }

  /**
   * Format time as HH:MM
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Check if time is within range (handles overnight ranges)
   */
  private isTimeInRange(current: string, start: string, end: string): boolean {
    const currentMinutes = this.timeToMinutes(current);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (startMinutes <= endMinutes) {
      // Normal range (e.g., 22:00 - 08:00 is not normal, this is 08:00 - 22:00)
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight range (e.g., 22:00 - 08:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  /**
   * Convert HH:MM to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
