import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '@prisma/client';

export class ChangeJobStatusDto {
  @ApiProperty({
    description: 'New job status',
    enum: JobStatus,
    example: JobStatus.ACTIVE,
  })
  @IsEnum(JobStatus)
  status: JobStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change (optional)',
    example: 'Position filled',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
