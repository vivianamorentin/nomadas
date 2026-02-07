import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

/**
 * Mark Notification as Read DTO
 * SPEC-NOT-001
 */
export class MarkReadDto {
  @IsUUID()
  notificationId: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
