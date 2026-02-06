import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { RedisService } from 'src/shared/infrastructure/cache/redis.service';
import { PrestigeCalculator } from './prestige-calculator.service';

/**
 * Reputation data interface
 */
export interface ReputationData {
  userId: number;
  averageRating: number;
  totalReviews: number;
  completedJobs: number;
  prestigeLevel: string;
  attributeRatings: {
    communication: number;
    punctuality: number;
    qualityOfWork: number;
    cleanliness: number;
  };
}

/**
 * Reputation Service
 * Handles rating aggregation, caching, and reputation queries
 *
 * Performance (SPEC-REV-001):
 * - Cache TTL: 1 hour
 * - Rating calculation: P95 < 100ms
 */
@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'reputation:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisService,
    private readonly prestigeCalculator: PrestigeCalculator,
  ) {}

  /**
   * Get user reputation data (with caching)
   *
   * @param userId - User ID to fetch reputation for
   * @returns Reputation data with ratings and prestige level
   */
  async getUserReputation(userId: number): Promise<ReputationData> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;

    // Try to get from cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for user ${userId}`);
      return JSON.parse(cached);
    }

    this.logger.debug(`Cache miss for user ${userId}, calculating...`);

    // Calculate from database
    const reputation = await this.calculateReputation(userId);

    // Cache for 1 hour
    await this.cache.set(
      cacheKey,
      JSON.stringify(reputation),
      this.CACHE_TTL,
    );

    return reputation;
  }

  /**
   * Calculate reputation data from database
   *
   * @param userId - User ID to calculate reputation for
   * @returns Reputation data
   */
  private async calculateReputation(
    userId: number,
  ): Promise<ReputationData> {
    // Get user type (WORKER or BUSINESS)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Get published reviews
    const reviews = await this.prisma.review.findMany({
      where: {
        revieweeId: userId,
        status: 'PUBLISHED',
      },
      select: {
        overallRating: true,
        communication: true,
        punctuality: true,
        qualityOfWork: true,
        cleanliness: true,
      },
    });

    if (reviews.length === 0) {
      return {
        userId,
        averageRating: 0,
        totalReviews: 0,
        completedJobs: 0,
        prestigeLevel: 'BRONZE',
        attributeRatings: {
          communication: 0,
          punctuality: 0,
          qualityOfWork: 0,
          cleanliness: 0,
        },
      };
    }

    // Calculate aggregate ratings
    const totalReviews = reviews.length;
    const sumRating = reviews.reduce(
      (acc, r) => acc + r.overallRating,
      0,
    );
    const averageRating = Math.round((sumRating / totalReviews) * 100) / 100;

    // Calculate attribute ratings
    const attributeRatings = {
      communication: this.calculateAttributeAverage(
        reviews.map((r) => r.communication),
      ),
      punctuality: this.calculateAttributeAverage(
        reviews.map((r) => r.punctuality),
      ),
      qualityOfWork: this.calculateAttributeAverage(
        reviews.map((r) => r.qualityOfWork),
      ),
      cleanliness: this.calculateAttributeAverage(
        reviews.map((r) => r.cleanliness),
      ),
    };

    // Get completed jobs count
    const completedJobs = totalReviews;

    // Calculate prestige level
    const prestigeLevel = this.prestigeCalculator.calculateLevel(
      completedJobs,
      averageRating,
    );

    return {
      userId,
      averageRating,
      totalReviews,
      completedJobs,
      prestigeLevel,
      attributeRatings,
    };
  }

  /**
   * Calculate average for optional attribute ratings
   *
   * @param values - Array of optional rating values
   * @returns Average rating (rounded to 1 decimal)
   */
  private calculateAttributeAverage(values: (number | null)[]): number {
    const validValues = values.filter((v) => v !== null && v !== undefined && v > 0);
    if (validValues.length === 0) return 0;

    const sum = validValues.reduce((acc, v) => acc + v!, 0);
    return Math.round((sum / validValues.length) * 10) / 10;
  }

  /**
   * Invalidate cache for a user
   *
   * @param userId - User ID to invalidate cache for
   */
  async invalidateCache(userId: number): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    await this.cache.del(cacheKey);
    this.logger.debug(`Cache invalidated for user ${userId}`);
  }

  /**
   * Recalculate user reputation (admin function)
   *
   * @param userId - User ID to recalculate
   * @returns Updated reputation data
   */
  async recalculateReputation(userId: number): Promise<ReputationData> {
    this.logger.log(`Recalculating reputation for user ${userId}`);

    // Invalidate cache
    await this.invalidateCache(userId);

    // Calculate fresh data
    const reputation = await this.calculateReputation(userId);

    // Update profile prestige level
    await this.updateProfilePrestige(userId, reputation);

    return reputation;
  }

  /**
   * Update user profile with new prestige data
   *
   * @param userId - User ID to update
   * @param reputation - New reputation data
   */
  private async updateProfilePrestige(
    userId: number,
    reputation: ReputationData,
  ): Promise<void> {
    // Get user type
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return;

    // Update based on user type
    if (user.role === 'WORKER') {
      await this.prisma.workerProfile.update({
        where: { userId },
        data: {
          prestigeLevel: reputation.prestigeLevel as any,
          averageRating: reputation.averageRating,
          totalReviews: reputation.totalReviews,
        },
      });
    } else if (user.role === 'BUSINESS') {
      await this.prisma.businessProfile.updateMany({
        where: { userId },
        data: {
          prestigeLevel: reputation.prestigeLevel as any,
          averageRating: reputation.averageRating,
          totalReviews: reputation.totalReviews,
        },
      });
    }
  }

  /**
   * Get multiple users' reputations (batch query)
   *
   * @param userIds - Array of user IDs
   * @returns Map of user ID to reputation data
   */
  async getBatchReputations(
    userIds: number[],
  ): Promise<Map<number, ReputationData>> {
    const reputations = new Map<number, ReputationData>();

    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const reputation = await this.getUserReputation(userId);
          reputations.set(userId, reputation);
        } catch (error) {
          this.logger.error(`Failed to get reputation for user ${userId}`, error);
        }
      }),
    );

    return reputations;
  }
}
