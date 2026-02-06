import {
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
  Length,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Attribute rating DTO
 * Optional detailed ratings for specific attributes
 */
export class AttributeRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  communication?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  punctuality?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  qualityOfWork?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  cleanliness?: number;
}

/**
 * Create Review DTO
 * Submit a review for a completed work agreement
 *
 * Validation Rules (SPEC-REV-001):
 * - workAgreementId must exist and be in COMPLETED status
 * - overallRating is required (1-5 stars)
 * - comment must be 20-500 characters
 * - attribute ratings are optional (1-5 stars each)
 * - Must be submitted within 14 days of work agreement end
 * - User can only submit one review per work agreement
 */
export class CreateReviewDto {
  @IsInt()
  workAgreementId: number;

  @IsInt()
  @Min(1)
  @Max(5)
  overallRating: number;

  @IsString()
  @Length(20, 500, {
    message: 'Comment must be between 20 and 500 characters',
  })
  comment: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AttributeRatingDto)
  attributesRating?: AttributeRatingDto;
}
