import { IsString, IsNotEmpty, IsDateString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Schedule DTO
 * Expected work schedule
 */
export class ScheduleDto {
  @ApiProperty({ example: 'full-time' })
  @IsString()
  type: string; // part-time, full-time, flexible

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  hoursPerWeek?: number;

  @ApiPropertyOptional({ example: ['Monday', 'Tuesday', 'Wednesday'] })
  @IsOptional()
  specificDays?: string[];

  @ApiPropertyOptional({ example: '9AM - 5PM' })
  @IsOptional()
  timeRange?: string;
}

/**
 * Compensation DTO
 * Agreed compensation structure
 */
export class CompensationDto {
  @ApiProperty({ example: 'hourly' })
  @IsString()
  type: string; // hourly, daily, fixed, weekly

  @ApiProperty({ example: 15 })
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ example: 'cash' })
  @IsOptional()
  paymentMethod?: string;
}

/**
 * Propose Agreement DTO
 * REQ-APP-007: Work Agreement Proposal
 */
export class ProposeAgreementDto {
  @ApiProperty({ example: 'Hospitality Staff' })
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @ApiProperty({ example: 'Responsible for guest services...' })
  @IsString()
  @IsNotEmpty()
  jobDescription: string;

  @ApiProperty({ example: ['Greeting guests', 'Serving drinks'] })
  @IsNotEmpty()
  responsibilities: string[];

  @ApiProperty({ example: '2024-06-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-09-01' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ type: ScheduleDto })
  @ValidateNested()
  @Type(() => ScheduleDto)
  expectedSchedule: ScheduleDto;

  @ApiProperty({ type: CompensationDto })
  @ValidateNested()
  @Type(() => CompensationDto)
  agreedCompensation: CompensationDto;

  @ApiPropertyOptional({ example: 'Shared room with 2 other workers' })
  @IsOptional()
  @IsString()
  accommodation?: string;

  @ApiPropertyOptional({ example: 'Breakfast and lunch provided' })
  @IsOptional()
  @IsString()
  meals?: string;
}
