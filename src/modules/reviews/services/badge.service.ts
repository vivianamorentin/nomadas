import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';

/**
 * Good Employer Badge Criteria
 */
interface GoodEmployerCriteria {
  averageRating: number;
  totalReviews: number;
  hasRecentSuspension: boolean;
}

/**
 * Badge Service
 * Handles badge evaluation, awarding, and revocation
 *
 * Business Rules (SPEC-REV-001):
 * - Good Employer Badge: 4.5+ rating AND 10+ reviews
 * - Badge revoked if criteria no longer met
 * - Badge revoked if user has recent suspension
 */
@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);
  private readonly GOOD_EMPLOYER_MIN_RATING = 4.5;
  private readonly GOOD_EMPLOYER_MIN_REVIEWS = 10;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluate if business is eligible for Good Employer badge
   *
   * @param businessId - Business profile ID
   * @returns True if eligible for badge
   */
  async evaluateGoodEmployerBadge(businessId: number): Promise<boolean> {
    this.logger.debug(`Evaluating Good Employer badge for business ${businessId}`);

    // Get business profile
    const business = await this.prisma.businessProfile.findUnique({
      where: { id: businessId },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!business) {
      this.logger.warn(`Business ${businessId} not found`);
      return false;
    }

    // Check criteria
    const criteria: GoodEmployerCriteria = {
      averageRating: business.averageRating,
      totalReviews: business.totalReviews,
      hasRecentSuspension: await this.hasRecentSuspension(business.userId),
    };

    const isEligible = this.checkGoodEmployerCriteria(criteria);

    this.logger.debug(
      `Business ${businessId} eligibility: ${isEligible}`,
      criteria,
    );

    return isEligible;
  }

  /**
   * Check if business meets Good Employer badge criteria
   *
   * @param criteria - Badge criteria
   * @returns True if criteria met
   */
  private checkGoodEmployerCriteria(
    criteria: GoodEmployerCriteria,
  ): boolean {
    return (
      criteria.averageRating >= this.GOOD_EMPLOYER_MIN_RATING &&
      criteria.totalReviews >= this.GOOD_EMPLOYER_MIN_REVIEWS &&
      !criteria.hasRecentSuspension
    );
  }

  /**
   * Update badge status for a business
   *
   * @param businessId - Business profile ID
   * @param hasBadge - New badge status
   */
  async updateBadgeStatus(
    businessId: number,
    hasBadge: boolean,
  ): Promise<void> {
    const business = await this.prisma.businessProfile.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error(`Business ${businessId} not found`);
    }

    const currentStatus = business.hasGoodEmployerBadge;

    // No change needed
    if (currentStatus === hasBadge) {
      return;
    }

    const now = new Date();

    if (hasBadge && !currentStatus) {
      // Award badge
      this.logger.log(`Awarding Good Employer badge to business ${businessId}`);

      await this.prisma.businessProfile.update({
        where: { id: businessId },
        data: {
          hasGoodEmployerBadge: true,
          goodEmployerBadgeAwardedAt: now,
          goodEmployerBadgeRevokedAt: null,
          goodEmployerBadgeCriteria: {
            rating: business.averageRating,
            reviews: business.totalReviews,
          },
        },
      });

      this.logger.log(`Good Employer badge awarded to business ${businessId}`);
    } else if (!hasBadge && currentStatus) {
      // Revoke badge
      this.logger.warn(`Revoking Good Employer badge from business ${businessId}`);

      await this.prisma.businessProfile.update({
        where: { id: businessId },
        data: {
          hasGoodEmployerBadge: false,
          goodEmployerBadgeRevokedAt: now,
        },
      });

      this.logger.warn(`Good Employer badge revoked from business ${businessId}`);
    }
  }

  /**
   * Evaluate and update badge status for all businesses
   * Called by scheduled job
   *
   * @returns Number of badges awarded/revoked
   */
  async evaluateAllBadges(): Promise<{
    awarded: number;
    revoked: number;
    evaluated: number;
  }> {
    this.logger.log('Evaluating Good Employer badges for all businesses');

    const businesses = await this.prisma.businessProfile.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        hasGoodEmployerBadge: true,
      },
    });

    let awarded = 0;
    let revoked = 0;

    for (const business of businesses) {
      try {
        const isEligible = await this.evaluateGoodEmployerBadge(business.id);

        if (isEligible && !business.hasGoodEmployerBadge) {
          await this.updateBadgeStatus(business.id, true);
          awarded++;
        } else if (!isEligible && business.hasGoodEmployerBadge) {
          await this.updateBadgeStatus(business.id, false);
          revoked++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to evaluate badge for business ${business.id}`,
          error,
        );
      }
    }

    this.logger.log(
      `Badge evaluation complete: ${awarded} awarded, ${revoked} revoked, ${businesses.length} evaluated`,
    );

    return {
      awarded,
      revoked,
      evaluated: businesses.length,
    };
  }

  /**
   * Get badge status for a business
   *
   * @param businessId - Business profile ID
   * @returns Badge status and criteria
   */
  async getBadgeStatus(businessId: number) {
    const business = await this.prisma.businessProfile.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        hasGoodEmployerBadge: true,
        goodEmployerBadgeAwardedAt: true,
        goodEmployerBadgeRevokedAt: true,
        goodEmployerBadgeCriteria: true,
        averageRating: true,
        totalReviews: true,
      },
    });

    if (!business) {
      throw new Error(`Business ${businessId} not found`);
    }

    // Check current eligibility
    const criteria: GoodEmployerCriteria = {
      averageRating: business.averageRating,
      totalReviews: business.totalReviews,
      hasRecentSuspension: await this.hasRecentSuspension(businessId),
    };

    const isEligible = this.checkGoodEmployerCriteria(criteria);

    return {
      businessId: business.id,
      hasGoodEmployerBadge: business.hasGoodEmployerBadge,
      awardedAt: business.goodEmployerBadgeAwardedAt,
      revokedAt: business.goodEmployerBadgeRevokedAt,
      criteriaMet: business.goodEmployerBadgeCriteria,
      currentlyEligible: isEligible,
      currentMetrics: {
        averageRating: business.averageRating,
        totalReviews: business.totalReviews,
        meetsRatingThreshold: business.averageRating >= this.GOOD_EMPLOYER_MIN_RATING,
        meetsReviewThreshold: business.totalReviews >= this.GOOD_EMPLOYER_MIN_REVIEWS,
      },
    };
  }

  /**
   * Check if user has recent suspension
   *
   * @param userId - User ID
   * @returns True if suspended in last 30 days
   */
  private async hasRecentSuspension(userId: number): Promise<boolean> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const suspension = await this.prisma.auditLog.findFirst({
      where: {
        userId,
        action: 'USER_SUSPENDED',
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return !!suspension;
  }

  /**
   * Get badge statistics
   *
   * @returns Badge stats
   */
  async getBadgeStats() {
    const [
      totalBadges,
      totalBusinesses,
      recentlyAwarded,
      recentlyRevoked,
    ] = await Promise.all([
      this.prisma.businessProfile.count({
        where: { hasGoodEmployerBadge: true },
      }),
      this.prisma.businessProfile.count(),
      this.prisma.businessProfile.count({
        where: {
          hasGoodEmployerBadge: true,
          goodEmployerBadgeAwardedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      this.prisma.businessProfile.count({
        where: {
          hasGoodEmployerBadge: false,
          goodEmployerBadgeRevokedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      totalBadges,
      totalBusinesses,
      badgePercentage: totalBusinesses > 0
        ? (totalBadges / totalBusinesses) * 100
        : 0,
      recentlyAwarded,
      recentlyRevoked,
    };
  }
}
