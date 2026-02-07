/**
 * Notification Channel Interface
 * SPEC-NOT-001
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
}

/**
 * Notification Delivery Result Interface
 */
export interface NotificationDeliveryResult {
  channel: NotificationChannel;
  success: boolean;
  error?: string;
  deliveredAt?: Date;
}

/**
 * Notification Send Result Interface
 */
export interface NotificationSendResult {
  notificationId: string;
  channels: NotificationDeliveryResult[];
  anySuccess: boolean;
  allFailed: boolean;
}
