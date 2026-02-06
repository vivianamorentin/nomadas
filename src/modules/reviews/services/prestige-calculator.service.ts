import { Injectable, Logger } from '@nestjs/common';
import { PrestigeLevel } from '@prisma/client';

/**
 * Prestige Calculator Service
 * Domain service for calculating worker and business prestige levels
 *
 * Algorithm (SPEC-REV-001):
 * - BRONZE: 0-4 completed jobs OR rating < 4.0
 * - SILVER: 5-9 completed jobs AND rating 4.0-4.4
 * - GOLD: 10-24 completed jobs AND rating 4.5-4.7
 * - PLATINUM: 25+ completed jobs AND rating 4.8+
 */
@Injectable()
export class PrestigeCalculator {
  private readonly logger = new Logger(PrestigeCalculator.name);

  /**
   * Calculate prestige level based on completed jobs and average rating
   *
   * @param completedJobs - Number of completed work agreements
   * @param averageRating - Average rating from all reviews
   * @returns Prestige level (BRONZE, SILVER, GOLD, PLATINUM)
   */
  calculateLevel(
    completedJobs: number,
    averageRating: number,
  ): PrestigeLevel {
    // Round average rating to 1 decimal place
    const rating = Math.round(averageRating * 10) / 10;

    this.logger.debug(
      `Calculating prestige level: ${completedJobs} jobs, ${rating} rating`,
    );

    // Platinum: 25+ jobs AND 4.8+ rating
    if (completedJobs >= 25 && rating >= 4.8) {
      return PrestigeLevel.PLATINUM;
    }

    // Gold: 10-24 jobs AND 4.5+ rating
    if (completedJobs >= 10 && rating >= 4.5) {
      return PrestigeLevel.GOLD;
    }

    // Silver: 5-9 jobs AND 4.0+ rating
    if (completedJobs >= 5 && rating >= 4.0) {
      return PrestigeLevel.SILVER;
    }

    // Bronze: Default for all other cases
    return PrestigeLevel.BRONZE;
  }

  /**
   * Calculate next prestige level threshold
   *
   * @param currentLevel - Current prestige level
   * @returns Object with required jobs and rating for next level
   */
  getNextLevelThreshold(currentLevel: PrestigeLevel): {
    level?: PrestigeLevel;
    requiredJobs: number;
    requiredRating: number;
  } {
    switch (currentLevel) {
      case PrestigeLevel.BRONZE:
        return {
          level: PrestigeLevel.SILVER,
          requiredJobs: 5,
          requiredRating: 4.0,
        };
      case PrestigeLevel.SILVER:
        return {
          level: PrestigeLevel.GOLD,
          requiredJobs: 10,
          requiredRating: 4.5,
        };
      case PrestigeLevel.GOLD:
        return {
          level: PrestigeLevel.PLATINUM,
          requiredJobs: 25,
          requiredRating: 4.8,
        };
      case PrestigeLevel.PLATINUM:
        return {
          requiredJobs: 25,
          requiredRating: 4.8,
        };
      default:
        return {
          requiredJobs: 5,
          requiredRating: 4.0,
        };
    }
  }

  /**
   * Calculate progress toward next prestige level
   *
   * @param completedJobs - Number of completed work agreements
   * @param averageRating - Average rating from all reviews
   * @returns Progress percentage (0-100)
   */
  calculateProgress(
    completedJobs: number,
    averageRating: number,
  ): number {
    const currentLevel = this.calculateLevel(completedJobs, averageRating);
    const threshold = this.getNextLevelThreshold(currentLevel);

    // If already at highest level, return 100%
    if (!threshold.level) {
      return 100;
    }

    // Calculate job progress (50% weight)
    const jobProgress =
      (completedJobs / threshold.requiredJobs) * 50;

    // Calculate rating progress (50% weight)
    const ratingProgress =
      (averageRating / threshold.requiredRating) * 50;

    // Total progress (capped at 100%)
    return Math.min(100, Math.round(jobProgress + ratingProgress));
  }

  /**
   * Check if user is eligible for suspension (low rating threshold)
   *
   * @param totalReviews - Total number of reviews received
   * @param averageRating - Average rating from all reviews
   * @returns True if user should be suspended
   */
  isEligibleForSuspension(
    totalReviews: number,
    averageRating: number,
  ): boolean {
    const RATING_THRESHOLD = 2.5;
    const MIN_REVIEWS = 5;

    return totalReviews >= MIN_REVIEWS && averageRating < RATING_THRESHOLD;
  }
}
