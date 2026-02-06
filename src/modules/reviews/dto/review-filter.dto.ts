import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewStatus } from '@prisma/client';

/**
 * Review Filter DTO
 * Query parameters for filtering reviews
 *
 * Usage:
 * - status: Filter by review status (PENDING, PUBLISHED, FLAGGED, HIDDEN)
 * - limit: Number of results per page (default: 10, max: 100)
 * - offset: Number of results to skip (for pagination, default: 0)
 * - sort: Sort order (ASC or DESC, default: DESC)
 */
export class ReviewFilterDto {
  @IsEnum(ReviewStatus, {
    message: 'Status must be one of: PENDING, PUBLISHED, FLAGGED, HIDDEN',
  })
  @IsOptional()
  status?: ReviewStatus;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;

  @IsEnum(['ASC', 'DESC'], {
    message: 'Sort must be either ASC or DESC',
  })
  @IsOptional()
  sort?: 'ASC' | 'DESC' = 'DESC';
}
