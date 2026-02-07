import { IsString, IsObject, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { NotificationType } from '@prisma/client';

/**
 * Create Notification DTO
 * SPEC-NOT-001
 */
export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsObject()
  payload: Record<string, any>;

  @IsOptional()
  @IsString()
  jobId?: string; // Bull queue job ID for tracking
}
