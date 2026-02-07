import { IsString, MinLength, MaxLength, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SearchJobsDto } from './search-jobs.dto';

export class CreateSavedSearchDto {
  @ApiProperty({
    description: 'Search name for easy identification',
    example: 'Summer jobs in Barcelona - Food Service',
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Search filters to save',
    type: SearchJobsDto,
  })
  @IsObject()
  searchFilters: SearchJobsDto;
}

export class UpdateSavedSearchDto {
  @ApiPropertyOptional({
    description: 'Updated search name',
    example: 'Updated search name',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated search filters',
    type: SearchJobsDto,
  })
  @IsOptional()
  @IsObject()
  searchFilters?: SearchJobsDto;

  @ApiPropertyOptional({
    description: 'Enable/disable notifications for new matching jobs',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  notificationEnabled?: boolean;
}
