import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  MinLength,
  MaxLength,
  ArrayMinSize,
  IsArray,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobCategory, WorkType, DurationUnit, CompensationType, RequiredExperience } from '@prisma/client';

export class JobLanguageDto {
  @ApiProperty({
    description: 'Language code (ISO 639-1)',
    example: 'en',
  })
  @IsString()
  language: string;

  @ApiProperty({
    description: 'CEFR level required',
    example: 'B2',
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
  })
  @IsString()
  level: string;
}

export class CreateJobLocationDto {
  @ApiPropertyOptional({
    description: 'Optional location name/identifier',
    example: 'Main Location',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationName?: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Passeig de Gràcia',
  })
  @IsString()
  @MaxLength(255)
  address: string;

  @ApiProperty({
    description: 'City name',
    example: 'Barcelona',
  })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    description: 'Country name',
    example: 'Spain',
  })
  @IsString()
  @MaxLength(100)
  country: string;

  @ApiPropertyOptional({
    description: 'Postal/ZIP code',
    example: '08001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 41.3851,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 2.1734,
  })
  @IsNumber()
  longitude: number;
}

export class CreateJobPostingDto {
  @ApiProperty({
    description: 'Job title',
    example: 'Summer Server - Beach Restaurant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: 'Detailed job description (min 50 characters)',
    example: 'Join our vibrant beach restaurant team for the summer season...',
  })
  @IsString()
  @MinLength(50)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    description: 'Specific requirements for this position',
    example: 'Must be available to work weekends and holidays',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  requirements?: string;

  @ApiProperty({
    description: 'Job category',
    enum: JobCategory,
    example: JobCategory.FOOD_SERVICE,
  })
  @IsEnum(JobCategory)
  category: JobCategory;

  @ApiProperty({
    description: 'Type of work arrangement',
    enum: WorkType,
    example: WorkType.SEASONAL,
  })
  @IsEnum(WorkType)
  workType: WorkType;

  // Duration
  @ApiPropertyOptional({
    description: 'Duration amount',
    example: 8,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  durationAmount?: number;

  @ApiPropertyOptional({
    description: 'Duration unit',
    enum: DurationUnit,
    example: DurationUnit.WEEKS,
  })
  @IsOptional()
  @IsEnum(DurationUnit)
  durationUnit?: DurationUnit;

  // Dates
  @ApiProperty({
    description: 'Job start date',
    example: '2024-06-01',
  })
  @IsString()
  startDate: string;

  @ApiProperty({
    description: 'Job end date',
    example: '2024-08-31',
  })
  @IsString()
  endDate: string;

  // Compensation
  @ApiPropertyOptional({
    description: 'Compensation type',
    enum: CompensationType,
    example: CompensationType.WEEKLY,
  })
  @IsOptional()
  @IsEnum(CompensationType)
  compensationType?: CompensationType;

  @ApiPropertyOptional({
    description: 'Minimum compensation (in currency)',
    example: 300,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compensationMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum compensation (in currency)',
    example: 400,
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
  @MaxLength(3)
  compensationCurrency?: string;

  // Benefits
  @ApiPropertyOptional({
    description: 'Accommodation included',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  accommodationIncluded?: boolean;

  @ApiPropertyOptional({
    description: 'Meals included',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  mealsIncluded?: boolean;

  // Requirements
  @ApiPropertyOptional({
    description: 'Required languages with CEFR levels',
    type: [JobLanguageDto],
    example: [{ language: 'en', level: 'B2' }, { language: 'es', level: 'A2' }],
  })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  requiredLanguages?: JobLanguageDto[];

  @ApiPropertyOptional({
    description: 'Required skills',
    type: [String],
    example: ['customer service', 'team work', 'English'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Required experience level',
    enum: RequiredExperience,
    example: RequiredExperience.BASIC,
  })
  @IsOptional()
  @IsEnum(RequiredExperience)
  requiredExperience?: RequiredExperience;

  // Locations
  @ApiProperty({
    description: 'Job locations (at least one required)',
    type: [CreateJobLocationDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  locations: CreateJobLocationDto[];
}
