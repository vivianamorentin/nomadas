import { IsString, IsInt, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Request Image Upload URL DTO
 * SPEC-MSG-001 Phase 2
 */
export class RequestImageUploadDto {
  @ApiProperty({
    description: 'Original filename',
    example: 'photo.jpg'
  })
  @IsString()
  @MaxLength(255)
  filename: string;

  @ApiProperty({
    description: 'File MIME type',
    example: 'image/jpeg',
    enum: ['image/jpeg', 'image/png', 'image/webp']
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes (max 5MB)',
    example: 1024000,
    maximum: 5242880
  })
  @IsInt()
  fileSizeBytes: number;
}

/**
 * Confirm Image Upload DTO
 * SPEC-MSG-001 Phase 2
 */
export class ConfirmImageUploadDto {
  @ApiProperty({
    description: 'S3 storage key from upload URL',
    example: 'messages/123/abc123-def456.jpg'
  })
  @IsString()
  storageKey: string;

  @ApiProperty({
    description: 'Image width in pixels',
    example: 1920
  })
  @IsInt()
  width: number;

  @ApiProperty({
    description: 'Image height in pixels',
    example: 1080
  })
  @IsInt()
  height: number;
}
