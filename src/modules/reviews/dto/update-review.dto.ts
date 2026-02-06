import { IsString, IsOptional, Length } from 'class-validator';

/**
 * Update Review DTO
 * Update review content (only before publication)
 *
 * Validation Rules:
 * - Can only update reviews in PENDING status
 * - Cannot change overallRating (immutable after submission)
 * - comment must be 20-500 characters if provided
 * - attribute ratings can be updated
 */
export class UpdateReviewDto {
  @IsString()
  @IsOptional()
  @Length(20, 500, {
    message: 'Comment must be between 20 and 500 characters',
  })
  comment?: string;

  // attribute ratings can be updated
  @IsOptional()
  communication?: number;

  @IsOptional()
  punctuality?: number;

  @IsOptional()
  qualityOfWork?: number;

  @IsOptional()
  cleanliness?: number;
}
