import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Mark Message Read DTO
 * SPEC-MSG-001 Phase 2
 */
export class MarkReadDto {
  @ApiPropertyOptional({
    description: 'Specific message ID to mark as read',
    example: 'clx1234567890'
  })
  @IsOptional()
  @IsUUID()
  messageId?: string;

  @ApiPropertyOptional({
    description: 'Mark all messages in conversation as read',
    example: true
  })
  @IsOptional()
  markAll?: boolean;
}
