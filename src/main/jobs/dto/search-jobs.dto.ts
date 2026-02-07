import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobCategory, WorkType, CompensationType, RequiredExperience } from '@prisma/client';

export class SearchJobsDto {
  @ApiPropertyOptional({
    description: 'Full-text search query',
    example: 'server beach restaurant',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Job categories filter',
    enum: JobCategory,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(JobCategory, { each: true })
  categories?: JobCategory[];

  @ApiPropertyOptional({
    description: 'Work type filter',
    enum: WorkType,
  })
  @IsOptional()
  @IsEnum(WorkType)
  workType?: WorkType;

  // Location filters
  @ApiPropertyOptional({
    description: 'Latitude for geospatial search',
    example: 41.3851,
  })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude for geospatial search',
    example: 2.1734,
  })
  @IsOptional()
  @IsNumber()
  lon?: number;

  @ApiPropertyOptional({
    description: 'Search radius in kilometers (max 100km)',
    example: 25,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  radius?: number;

  // Date filters
  @ApiPropertyOptional({
    description: 'Start date from (ISO 8601)',
    example: '2024-06-01',
  })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Start date to (ISO 8601)',
    example: '2024-07-01',
  })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({
    description: 'End date from (ISO 8601)',
    example: '2024-08-01',
  })
  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date to (ISO 8601)',
    example: '2024-09-30',
  })
  @IsOptional()
  @IsDateString()
  endDateTo?: string;

  // Duration filters
  @ApiPropertyOptional({
    description: 'Minimum duration amount',
    example: 4,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum duration amount',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMax?: number;

  @ApiPropertyOptional({
    description: 'Duration unit',
    example: 'WEEKS',
  })
  @IsOptional()
  @IsString()
  durationUnit?: string;

  // Compensation filters
  @ApiPropertyOptional({
    description: 'Minimum compensation',
    example: 300,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compensationMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum compensation',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compensationMax?: number;

  @ApiPropertyOptional({
    description: 'Compensation currency (ISO 4217)',
    example: 'EUR',
  })
  @IsOptional()
  @IsString()
  compensationCurrency?: string;

  @ApiPropertyOptional({
    description: 'Compensation type',
    enum: CompensationType,
  })
  @IsOptional()
  @IsEnum(CompensationType)
  compensationType?: CompensationType;

  // Requirements filters
  @ApiPropertyOptional({
    description: 'Required languages (ISO 639-1 codes)',
    example: ['en', 'es'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Required skills',
    example: ['customer service', 'English'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Required experience level',
    enum: RequiredExperience,
  })
  @IsOptional()
  @IsEnum(RequiredExperience)
  requiredExperience?: RequiredExperience;

  // Benefits filters
  @ApiPropertyOptional({
    description: 'Accommodation required',
    example: true,
  })
  @IsOptional()
  accommodationIncluded?: boolean;

  @ApiPropertyOptional({
    description: 'Meals required',
    example: true,
  })
  @IsOptional()
  mealsIncluded?: boolean;

  // Sorting
  @ApiPropertyOptional({
    description: 'Sort option',
    example: 'relevance',
    enum: ['relevance', 'date', 'compensation', 'distance'],
  })
  @IsOptional()
  @IsString()
  sort?: string;

  // Pagination
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Results per page (max 20)',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;
}
