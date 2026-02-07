import { IsString, IsNotEmpty, IsIP } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Confirm Agreement DTO
 * REQ-APP-008: Digital Agreement Confirmation
 */
export class ConfirmAgreementDto {
  @ApiProperty({
    example: 'I confirm that I have read and agree to the work agreement terms',
    description: 'Explicit consent text for digital signature'
  })
  @IsString()
  @IsNotEmpty()
  consentText: string;

  @ApiProperty({
    example: '192.168.1.1',
    description: 'IP address captured on frontend (optional for verification)'
  })
  @IsIP()
  @IsNotEmpty()
  ipAddress: string;

  @ApiProperty({
    example: 'Mozilla/5.0...',
    description: 'User agent captured on frontend'
  })
  @IsString()
  @IsNotEmpty()
  userAgent: string;
}
