import { IsString, Length } from 'class-validator';

/**
 * Respond to Review DTO
 * Submit a response to a review received
 *
 * Validation Rules (SPEC-REV-001):
 * - Only the reviewee can respond
 * - Response must be 1-500 characters
 * - Only one response allowed per review
 * - Can be updated until review is hidden/moderated
 */
export class RespondReviewDto {
  @IsString()
  @Length(1, 500, {
    message: 'Response must be between 1 and 500 characters',
  })
  response: string;
}
