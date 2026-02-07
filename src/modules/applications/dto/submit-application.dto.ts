import { IsString, IsNotEmpty, MaxLength, IsArray, IsOptional, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Screening answer DTO
 * Represents answer to a screening question
 */
export class ScreeningAnswerDto {
  @ApiProperty()
  @IsInt()
  questionId: number;

  @ApiProperty()
  answer: string | string[];
}

/**
 * Submit Application DTO
 * REQ-APP-001: Job Application Submission
 */
export class SubmitApplicationDto {
  @ApiProperty({ example: 'I am excited about this opportunity...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Cover letter must not exceed 500 characters' })
  coverLetter: string;

  @ApiPropertyOptional({ type: [ScreeningAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScreeningAnswerDto)
  screeningAnswers?: ScreeningAnswerDto[];
}
