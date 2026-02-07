import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveJobDto {
  @ApiProperty({
    description: 'Job ID to save',
    example: 1,
  })
  jobPostingId: number;

  @ApiPropertyOptional({
    description: 'Worker private notes about this job',
    example: 'Great location, good pay, apply before May',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateSavedSearchDto {
  @ApiProperty({
    description: 'Search name for easy identification',
    example: 'Barcelona Summer Jobs',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Serialized search filters',
    example: { categories: ['FOOD_SERVICE'], city: 'Barcelona', startDateFrom: '2024-06-01' },
  })
  searchFilters: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Enable notifications for new matches',
    example: true,
  })
  @IsOptional()
  notificationEnabled?: boolean;
}

export class UpdateSavedSearchDto {
  @ApiPropertyOptional({
    description: 'Updated search name',
    example: 'Barcelona Summer Restaurant Jobs',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated search filters',
  })
  @IsOptional()
  searchFilters?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Toggle notifications',
    example: false,
  })
  @IsOptional()
  notificationEnabled?: boolean;
}
