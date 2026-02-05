import { IsEmail, IsString, MinLength, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters, uppercase, lowercase, number, special character)',
    example: 'Password123!',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Preferred language',
    enum: ['en', 'es'],
    default: 'en',
    example: 'en',
  })
  @IsEnum(['en', 'es'])
  preferredLanguage: string = 'en';

  @ApiProperty({
    description: 'Acceptance of Terms of Service',
    example: true,
  })
  @IsBoolean()
  acceptTos: boolean;
}