import { IsString, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JobLocationDto {
  @ApiProperty({
    description: 'Location ID',
    example: 1,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'Location name/identifier',
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
