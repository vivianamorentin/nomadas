import { IsString, IsOptional, IsBoolean, IsInt, IsObject, IsEnum } from 'class-validator';
import { NotificationType } from '@prisma/client';

/**
 * Create Template DTO
 * Admin only - create new notification template
 */
export class CreateTemplateDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  language: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  htmlBody?: string;

  @IsOptional()
  @IsString()
  textBody?: string;

  @IsOptional()
  @IsString()
  pushTitle?: string;

  @IsOptional()
  @IsString()
  pushBody?: string;

  @IsOptional()
  @IsString()
  smsTemplate?: string;

  @IsOptional()
  @IsString()
  inAppTemplate?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}

/**
 * Update Template DTO
 * Admin only - update existing template
 */
export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  htmlBody?: string;

  @IsOptional()
  @IsString()
  textBody?: string;

  @IsOptional()
  @IsString()
  pushTitle?: string;

  @IsOptional()
  @IsString()
  pushBody?: string;

  @IsOptional()
  @IsString()
  smsTemplate?: string;

  @IsOptional()
  @IsString()
  inAppTemplate?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Render Template DTO
 * Test endpoint - render template with variables
 */
export class RenderTemplateDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  language: string;

  @IsObject()
  variables: Record<string, any>;
}

/**
 * Query Templates DTO
 */
export class QueryTemplatesDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @IsInt()
  limit?: number = 20;
}
