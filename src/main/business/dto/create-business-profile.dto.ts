import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean, MinLength, MaxLength, ArrayMinSize, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessType } from '@prisma/client';

export class CreateBusinessProfileDto {
  // Business Information
  @ApiProperty({
    description: 'Business name',
    example: 'Sunset Beach Bar',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  businessName: string;

  @ApiProperty({
    description: 'Type of business',
    enum: BusinessType,
    example: BusinessType.BAR,
  })
  @IsEnum(BusinessType)
  businessType: BusinessType;

  @ApiProperty({
    description: 'Custom business type (required when businessType is OTHER)',
    example: 'Dive Center',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessTypeCustom?: string;

  @ApiProperty({
    description: 'Business description',
    example: 'A vibrant beach bar located on the beautiful coast of Barcelona...',
  })
  @IsString()
  @MinLength(50)
  @MaxLength(500)
  description: string;

  // Location
  @ApiProperty({
    description: 'Full street address',
    example: '123 Passeig de Gràcia',
  })
  @IsString()
  @MaxLength(255)
  locationAddress: string;

  @ApiProperty({
    description: 'City name',
    example: 'Barcelona',
  })
  @IsString()
  @MaxLength(100)
  locationCity: string;

  @ApiProperty({
    description: 'Country name',
    example: 'Spain',
  })
  @IsString()
  @MaxLength(100)
  locationCountry: string;

  @ApiProperty({
    description: 'Postal/ZIP code',
    example: '08001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  locationPostalCode?: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 41.3851,
  })
  @IsNumber()
  locationLatitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 2.1734,
  })
  @IsNumber()
  locationLongitude: number;

  // Contact
  @ApiProperty({
    description: 'Contact email address',
    example: 'contact@sunsetbeachbar.com',
  })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+34 931 23 45 67',
  })
  @IsString()
  @MaxLength(50)
  contactPhone: string;

  @ApiProperty({
    description: 'Website URL',
    example: 'https://sunsetbeachbar.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  websiteUrl?: string;

  @ApiProperty({
    description: 'Whether this is the primary business profile',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
