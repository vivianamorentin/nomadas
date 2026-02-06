import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { FlagReviewDto, ModerateReviewDto, FlagCategory } from '../dto';
import { PrestigeCalculator } from './prestige-calculator.service';

/**
 * Moderation Service
 * Handles review flagging, moderation, and auto-suspension
 *
 * Business Rules (SPEC-REV-001):
 * - Users can flag reviews with category and comment
 * - Multiple flags trigger moderation review
 * - Auto-suspension for users with < 2.5 rating and 5+ reviews
 * - Moderators can approve, hide, or suspend based on flags
 */
@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private readonly AUTO_SUSPEND_THRESHOLD = 2.5;
  private readonly AUTO_SUSPEND_MIN_REVIEWS = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly prestigeCalculator: PrestigeCalculator,
  ) {}

  /**
   * Flag a review for moderation
   *
   * @param reviewId - Review ID to flag
   * @param userId - User flagging the review
   * @param flagReviewDto - Flag details
   * @returns Updated review
   */
  async flagReview(
    reviewId: number,
    userId: number,
    flagReviewDto: FlagReviewDto,
  ) {
    this.logger.log(
      `User ${userId} flagging review ${reviewId} with category: ${flagReviewDto.category}`,
    );

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Cannot flag already moderated reviews
    if (review.moderationStatus === 'APPROVED') {
      throw new BadRequestException('This review has already been approved');
    }

    // Get current flag reasons
    const flagReasons = Array.isArray(review.flagReasons)
      ? review.flagReasons
      : [];

    // Add new flag
    flagReasons.push({
      category: flagReviewDto.category,
      comment: flagReviewDto.comment || '',
      flaggedBy: userId,
      flaggedAt: new Date().toISOString(),
    });

    // Update review
    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        flagCount: { increment: 1 },
        flagReasons,
        status: 'FLAGGED',
        moderationStatus: 'PENDING_REVIEW',
        auditLog: this.appendAuditLog(review.auditLog, 'FLAG', {
          flaggerId: userId,
          category: flagReviewDto.category,
        }),
      },
    });

    this.logger.log(
      `Review ${reviewId} flagged (flag count: ${updatedReview.flagCount})`,
    );

    // Check if user should be auto-suspended
    await this.evaluateSuspension(review.revieweeId);

    return updatedReview;
  }

  /**
   * Moderate a flagged review (admin only)
   *
   * @param reviewId - Review ID to moderate
   * @param moderateReviewDto - Moderation action
   * @returns Updated review
   */
  async moderateReview(
    reviewId: number,
    moderateReviewDto: ModerateReviewDto,
  ) {
    this.logger.log(
      `Moderating review ${reviewId} with action: ${moderateReviewDto.action}`,
    );

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewee: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Update review based on action
    const updateData: any = {
      moderationStatus: moderateReviewDto.action as any,
      auditLog: this.appendAuditLog(review.auditLog, 'MODERATE', {
        action: moderateReviewDto.action,
        reason: moderateReviewDto.reason,
      }),
    };

    switch (moderateReviewDto.action) {
      case 'APPROVE':
        // Approve and publish
        updateData.status = 'PUBLISHED';
        updateData.publishedAt = new Date();
        updateData.flagCount = 0;
        updateData.flagReasons = [];
        break;

      case 'HIDE':
        // Hide review
        updateData.status = 'HIDDEN';
        break;

      case 'SUSPEND_USER':
        // Hide review and suspend user
        updateData.status = 'HIDDEN';
        await this.suspendUser(review.revieweeId, {
          reason: 'Review moderation',
          details: moderateReviewDto.reason || 'Flagged review',
        });
        break;
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: updateData,
    });

    this.logger.log(`Review ${reviewId} moderated with action: ${moderateReviewDto.action}`);

    return updatedReview;
  }

  /**
   * Get all flagged reviews pending moderation
   *
   * @param limit - Max results
   * @param offset - Results to skip
   * @returns Flagged reviews
   */
  async getFlaggedReviews(limit = 20, offset = 0) {
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          moderationStatus: 'PENDING_REVIEW',
        },
        include: {
          reviewer: {
            select: {
              id: true,
              email: true,
            },
          },
          reviewee: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { flagCount: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.review.count({
        where: {
          moderationStatus: 'PENDING_REVIEW',
        },
      }),
    ]);

    return {
      reviews,
      total,
      limit,
      offset,
    };
  }

  /**
   * Evaluate if user should be auto-suspended
   *
   * @param userId - User ID to evaluate
   * @returns True if user was suspended
   */
  async evaluateSuspension(userId: number): Promise<boolean> {
    this.logger.debug(`Evaluating suspension for user ${userId}`);

    // Get user's published reviews
    const reviews = await this.prisma.review.findMany({
      where: {
        revieweeId: userId,
        status: 'PUBLISHED',
      },
      select: {
        overallRating: true,
      },
    });

    if (reviews.length < this.AUTO_SUSPEND_MIN_REVIEWS) {
      return false;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((acc, r) => acc + r.overallRating, 0);
    const averageRating = totalRating / reviews.length;

    // Check if eligible for suspension
    const isEligible = this.prestigeCalculator.isEligibleForSuspension(
      reviews.length,
      averageRating,
    );

    if (isEligible) {
      this.logger.warn(
        `User ${userId} eligible for suspension: ${reviews.length} reviews, ${averageRating.toFixed(2)} avg rating`,
      );

      await this.suspendUser(userId, {
        reason: 'LOW_RATING',
        details: `Average rating ${averageRating.toFixed(2)} below ${this.AUTO_SUSPEND_THRESHOLD} threshold with ${reviews.length} reviews`,
        appealable: true,
        appealWindowDays: 7,
      });

      return true;
    }

    return false;
  }

  /**
   * Suspend a user
   *
   * @param userId - User ID to suspend
   * @param options - Suspension options
   */
  private async suspendUser(
    userId: number,
    options: {
      reason: string;
      details: string;
      appealable?: boolean;
      appealWindowDays?: number;
    },
  ): Promise<void> {
    this.logger.warn(`Suspending user ${userId} for reason: ${options.reason}`);

    // Hide all user's published reviews
    await this.prisma.review.updateMany({
      where: {
        reviewerId: userId,
        status: 'PUBLISHED',
      },
      data: {
        status: 'HIDDEN',
        moderationStatus: 'SUSPENDED_USER',
      },
    });

    // Log to audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_SUSPENDED',
        details: options,
      },
    });

    this.logger.warn(`User ${userId} suspended successfully`);
  }

  /**
   * Unsuspend a user (admin action)
   *
   * @param userId - User ID to unsuspend
   */
  async unsuspendUser(userId: number): Promise<void> {
    this.logger.log(`Unsuspending user ${userId}`);

    // Restore hidden reviews
    await this.prisma.review.updateMany({
      where: {
        reviewerId: userId,
        moderationStatus: 'SUSPENDED_USER',
      },
      data: {
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED',
        flagCount: 0,
        flagReasons: [],
      },
    });

    // Log to audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_UNSUSPENDED',
        details: { timestamp: new Date().toISOString() },
      },
    });

    this.logger.log(`User ${userId} unsuspended successfully`);
  }

  /**
   * Get moderation statistics
   *
   * @returns Moderation stats
   */
  async getModerationStats() {
    const [pendingTotal, hiddenTotal, suspendedUsers] = await Promise.all([
      this.prisma.review.count({
        where: { moderationStatus: 'PENDING_REVIEW' },
      }),
      this.prisma.review.count({
        where: { status: 'HIDDEN' },
      }),
      this.prisma.auditLog.count({
        where: { action: 'USER_SUSPENDED' },
      }),
    ]);

    return {
      pendingReviews: pendingTotal,
      hiddenReviews: hiddenTotal,
      suspendedUsers,
    };
  }

  /**
   * Append entry to audit log
   *
   * @param auditLog - Existing audit log
   * @param action - Action performed
   * @param details - Action details
   * @returns Updated audit log array
   */
  private appendAuditLog(
    auditLog: any,
    action: string,
    details: any,
  ): any[] {
    const logs = Array.isArray(auditLog) ? auditLog : [];
    return [
      ...logs,
      {
        action,
        timestamp: new Date().toISOString(),
        details,
      },
    ];
  }
}
