import { IsString, IsOptional, IsUUID, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Send Message DTO
 * SPEC-MSG-001 Phase 2
 */
export class SendMessageDto {
  @ApiProperty({
    description: 'Message type',
    enum: ['TEXT', 'IMAGE', 'SYSTEM'],
    default: 'TEXT'
  })
  @IsEnum(['TEXT', 'IMAGE', 'SYSTEM'])
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';

  @ApiPropertyOptional({
    description: 'Text content (for TEXT messages)',
    example: 'Hello, I am interested in this job',
    maxLength: 5000
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({
    description: 'S3 key of uploaded image (for IMAGE messages)',
    example: 'messages/123/image-abc123.jpg'
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON object)',
    example: '{"replyToMessageId": "abc123"}'
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
