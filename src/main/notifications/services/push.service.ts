import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { DevicePlatform } from '@prisma/client';

/**
 * Push Service
 * Sends push notifications via FCM (Android) and APNs (iOS)
 * SPEC-NOT-001 Phase 5
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private fcmApp: admin.app.App;

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        this.fcmApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        }, 'notifications');

        this.logger.log('Firebase Admin SDK initialized successfully');
      } else {
        this.logger.warn('Firebase credentials not configured');
      }
    } catch (error) {
      this.logger.error('Error initializing Firebase', error);
    }
  }

  /**
   * Send push notification to device
   */
  async sendPushNotification(data: {
    token: string;
    platform: DevicePlatform;
    title: string;
    body: string;
    data?: Record<string, any>;
    notificationId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.fcmApp) {
        throw new Error('Firebase not initialized');
      }

      // Build FCM message
      const message: admin.messaging.Message = {
        token: data.token,
        notification: {
          title: data.title,
          body: data.body,
        },
        data: data.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'notifications',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: data.title,
                body: data.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      // Add notification ID to data
      if (data.notificationId) {
        message.data.notificationId = data.notificationId;
      }

      this.logger.debug(`Sending push notification to token: ${data.token.substring(0, 20)}...`);

      // Send via FCM
      const response = await this.fcmApp.messaging().send(message);

      this.logger.log(`Push notification sent successfully, messageId: ${response}`);

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      this.logger.error(`Error sending push notification`, error);

      // Handle invalid token
      if (error.code === 'messaging/registration-token-not-registered') {
        return {
          success: false,
          error: 'INVALID_TOKEN',
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendMulticast(data: {
    tokens: string[];
    platform: DevicePlatform;
    title: string;
    body: string;
    data?: Record<string, any>;
    notificationId?: string;
  }): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
    try {
      if (!this.fcmApp) {
        throw new Error('Firebase not initialized');
      }

      const message: admin.messaging.MulticastMessage = {
        tokens: data.tokens,
        notification: {
          title: data.title,
          body: data.body,
        },
        data: data.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'notifications',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: data.title,
                body: data.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      // Add notification ID to data
      if (data.notificationId) {
        message.data.notificationId = data.notificationId;
      }

      this.logger.debug(`Sending multicast push to ${data.tokens.length} devices`);

      // Send multicast
      const response = await this.fcmApp.messaging().sendMulticast(message);

      // Extract invalid tokens
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(data.tokens[idx]);
        }
      });

      this.logger.log(`Multicast sent: ${response.successCount} success, ${response.failureCount} failed`);

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (error) {
      this.logger.error(`Error sending multicast push`, error);
      return {
        successCount: 0,
        failureCount: data.tokens.length,
        invalidTokens: [],
      };
    }
  }

  /**
   * Validate device token format
   */
  validateToken(token: string, platform: DevicePlatform): boolean {
    if (platform === DevicePlatform.IOS) {
      // APNs tokens are 64 hexadecimal characters
      return /^[a-fA-F0-9]{64}$/.test(token);
    } else if (platform === DevicePlatform.ANDROID) {
      // FCM tokens vary but should be at least 100 characters
      return token.length >= 100;
    }
    return false;
  }

  /**
   * Check if push service is configured
   */
  isConfigured(): boolean {
    return !!this.fcmApp;
  }

  /**
   * Subscribe device to topic
   * For future use with topic-based messaging
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.fcmApp) {
        throw new Error('Firebase not initialized');
      }

      await this.fcmApp.messaging().subscribeToTopic(tokens, topic);

      this.logger.log(`Subscribed ${tokens.length} devices to topic: ${topic}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Error subscribing to topic`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Unsubscribe device from topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.fcmApp) {
        throw new Error('Firebase not initialized');
      }

      await this.fcmApp.messaging().unsubscribeFromTopic(tokens, topic);

      this.logger.log(`Unsubscribed ${tokens.length} devices from topic: ${topic}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Error unsubscribing from topic`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
