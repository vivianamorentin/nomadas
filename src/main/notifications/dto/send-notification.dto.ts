import { IsString, IsEnum, IsObject, IsUUID, IsArray, IsOptional } from 'class-validator';
import { NotificationType } from '@prisma/client';
import { NotificationChannel } from '../interfaces/notification-channel.interface';

/**
 * Send Notification DTO
 * Internal API for creating and sending notifications
 * SPEC-NOT-001
 */
export class SendNotificationDto {
  @IsUUID()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsObject()
  payload: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[]; // If not provided, uses user preferences
}

/**
 * Notification Channel Enum
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
}
