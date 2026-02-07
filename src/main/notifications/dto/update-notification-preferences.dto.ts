import { IsBoolean, IsOptional, IsString, IsEnum, IsObject } from 'class-validator';
import { EmailDigestFrequency } from '@prisma/client';

/**
 * Update Notification Preferences DTO
 * SPEC-NOT-001
 */
export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @IsOptional()
  @IsString()
  quietHoursStart?: string; // Format: "HH:MM"

  @IsOptional()
  @IsString()
  quietHoursEnd?: string; // Format: "HH:MM"

  @IsOptional()
  @IsString()
  quietHoursTimezone?: string;

  @IsOptional()
  @IsEnum(EmailDigestFrequency)
  emailDigest?: EmailDigestFrequency;

  @IsOptional()
  @IsObject()
  typePreferences?: Record<string, any>;
}
