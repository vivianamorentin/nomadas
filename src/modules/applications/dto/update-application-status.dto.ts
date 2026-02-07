import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';

/**
 * Update Application Status DTO
 * REQ-APP-004: Accept/Reject Workflow
 */
export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: ApplicationStatus, example: ApplicationStatus.ACCEPTED })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiPropertyOptional({ example: 'Great experience and skills' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
