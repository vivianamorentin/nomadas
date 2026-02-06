import { IsString, IsEnum, Length, IsOptional } from 'class-validator';

/**
 * Flag Category Enum
 * Categories for flagging inappropriate reviews
 */
export enum FlagCategory {
  OFFENSIVE = 'OFFENSIVE',
  FALSE_INFO = 'FALSE_INFO',
  CONFLICT = 'CONFLICT',
  POLICY_VIOLATION = 'POLICY_VIOLATION',
  SPAM = 'SPAM',
}

/**
 * Flag Review DTO
 * Flag a review for moderation
 *
 * Validation Rules (SPEC-REV-001):
 * - category must be one of the defined flag categories
 * - comment is optional but recommended for context
 */
export class FlagReviewDto {
  @IsEnum(FlagCategory, {
    message: 'Category must be one of: OFFENSIVE, FALSE_INFO, CONFLICT, POLICY_VIOLATION, SPAM',
  })
  category: FlagCategory;

  @IsString()
  @IsOptional()
  @Length(0, 500, {
    message: 'Comment must not exceed 500 characters',
  })
  comment?: string;
}
