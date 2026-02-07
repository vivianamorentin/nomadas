import { PrestigeLevel } from '@prisma/client';

/**
 * Calculate business prestige level based on reviews
 *
 * Criteria:
 * - Bronze: < 5 reviews OR < 4.0 rating
 * - Silver: 5-9 reviews, 4.0-4.4 rating
 * - Gold: 10-24 reviews, 4.5-4.7 rating
 * - Platinum: 25+ reviews, 4.8+ rating
 */
export function calculatePrestigeLevel(
  totalReviews: number,
  averageRating: number,
): PrestigeLevel {
  // Bronze: Default or low rating
  if (totalReviews < 5 || averageRating < 4.0) {
    return PrestigeLevel.BRONZE;
  }

  // Silver: 5-9 reviews, good rating
  if (
    totalReviews >= 5 &&
    totalReviews <= 9 &&
    averageRating >= 4.0 &&
    averageRating <= 4.4
  ) {
    return PrestigeLevel.SILVER;
  }

  // Gold: 10-24 reviews, excellent rating
  if (
    totalReviews >= 10 &&
    totalReviews <= 24 &&
    averageRating >= 4.5 &&
    averageRating <= 4.7
  ) {
    return PrestigeLevel.GOLD;
  }

  // Platinum: 25+ reviews, outstanding rating
  if (totalReviews >= 25 && averageRating >= 4.8) {
    return PrestigeLevel.PLATINUM;
  }

  return PrestigeLevel.BRONZE;
}

/**
 * Check if business qualifies for Good Employer badge
 *
 * Criteria: 10+ reviews AND 4.5+ rating
 */
export function hasGoodEmployerBadge(
  totalReviews: number,
  averageRating: number,
): boolean {
  return totalReviews >= 10 && averageRating >= 4.5;
}
