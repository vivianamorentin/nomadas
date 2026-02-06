import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { ReputationService } from './reputation.service';
import { CreateReviewDto, UpdateReviewDto, RespondReviewDto } from '../dto';

/**
 * Review Service
 * Handles review submission, publication, and management
 *
 * Business Rules (SPEC-REV-001):
 * - 14-day submission window after work agreement end
 * - One review per agreement (bidirectional)
 * - Reciprocal or deferred publication (14 days)
 * - Reviews published when both parties review OR after 14-day deadline
 */
@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);
  private readonly REVIEW_WINDOW_DAYS = 14;

  constructor(
    private readonly prisma: PrismaService,
    private readonly reputationService: ReputationService,
  ) {}

  /**
   * Submit a review for a completed work agreement
   *
   * @param reviewerId - User submitting the review
   * @param createReviewDto - Review data
   * @returns Created review
   * @throws BadRequestException if validation fails
   * @throws ConflictException if review already exists
   */
  async submitReview(
    reviewerId: number,
    createReviewDto: CreateReviewDto,
  ) {
    this.logger.log(
      `User ${reviewerId} submitting review for agreement ${createReviewDto.workAgreementId}`,
    );

    // Validate work agreement exists and is completed
    const agreement = await this.prisma.workAgreement.findUnique({
      where: { id: createReviewDto.workAgreementId },
      include: {
        application: {
          include: {
            jobPosting: {
              select: {
                businessId: true,
              },
            },
            workerProfile: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!agreement) {
      throw new NotFoundException('Work agreement not found');
    }

    if (agreement.application.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Can only review completed work agreements',
      );
    }

    // Validate 14-day submission window
    const daysSinceEnd = this.daysSince(agreement.endDate);
    if (daysSinceEnd > this.REVIEW_WINDOW_DAYS) {
      throw new BadRequestException(
        `Review window closed. Reviews must be submitted within ${this.REVIEW_WINDOW_DAYS} days of work agreement end`,
      );
    }

    // Determine reviewee (business or worker)
    const workerId = agreement.application.workerProfile.userId;
    const businessId = agreement.application.jobPosting.businessId;
    const revieweeId = reviewerId === workerId ? businessId : workerId;

    // Validate reviewer is part of the agreement
    if (reviewerId !== workerId && reviewerId !== businessId) {
      throw new BadRequestException(
        'You are not authorized to review this work agreement',
      );
    }

    // Check for existing review
    const existingReview = await this.prisma.review.findUnique({
      where: { workAgreementId: agreement.id },
    });

    if (existingReview) {
      // Check if it's the same user
      if (existingReview.reviewerId === reviewerId) {
        throw new ConflictException('You have already reviewed this work agreement');
      }

      // Other party has already submitted, publish both
      this.logger.log('Both parties have reviewed, publishing both reviews');

      await this.prisma.$transaction([
        // Publish existing review
        this.prisma.review.update({
          where: { id: existingReview.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        }),
        // Create and publish new review
        this.prisma.review.create({
          data: {
            workAgreementId: agreement.id,
            reviewerId,
            revieweeId,
            overallRating: createReviewDto.overallRating,
            communication: createReviewDto.attributesRating?.communication || 0,
            punctuality: createReviewDto.attributesRating?.punctuality || 0,
            qualityOfWork: createReviewDto.attributesRating?.qualityOfWork || 0,
            cleanliness: createReviewDto.attributesRating?.cleanliness || 0,
            comment: createReviewDto.comment,
            status: 'PUBLISHED',
            submittedAt: new Date(),
            publishedAt: new Date(),
            auditLog: this.createAuditLog('CREATE', {
              method: 'reciprocal_publication',
            }),
          },
        }),
      ]);

      // Invalidate reputation cache for both reviewee
      await this.reputationService.invalidateCache(revieweeId);
      if (existingReview.revieweeId !== revieweeId) {
        await this.reputationService.invalidateCache(existingReview.revieweeId);
      }

      // Return the new review
      const newReview = await this.prisma.review.findFirst({
        where: {
          workAgreementId: agreement.id,
          reviewerId,
        },
        include: {
          reviewer: {
            select: {
              email: true,
            },
          },
          reviewee: {
            select: {
              email: true,
            },
          },
        },
      });

      return newReview;
    }

    // Create review in PENDING status (waiting for other party or 14-day deadline)
    const review = await this.prisma.review.create({
      data: {
        workAgreementId: agreement.id,
        reviewerId,
        revieweeId,
        overallRating: createReviewDto.overallRating,
        communication: createReviewDto.attributesRating?.communication || 0,
        punctuality: createReviewDto.attributesRating?.punctuality || 0,
        qualityOfWork: createReviewDto.attributesRating?.qualityOfWork || 0,
        cleanliness: createReviewDto.attributesRating?.cleanliness || 0,
        comment: createReviewDto.comment,
        status: 'PENDING',
        submittedAt: new Date(),
        auditLog: this.createAuditLog('CREATE', {
          method: 'deferred_publication',
          deadline: new Date(
            agreement.endDate.getTime() + this.REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000,
          ),
        }),
      },
      include: {
        reviewer: {
          select: {
            email: true,
          },
        },
        reviewee: {
          select: {
            email: true,
          },
        },
      },
    });

    this.logger.log(`Review ${review.id} created in PENDING status`);

    // Schedule delayed publication (would be handled by Bull Queue)
    // await this.scheduleDelayedPublication(review.id, agreement.endDate);

    return review;
  }

  /**
   * Publish delayed reviews (after 14-day deadline)
   * Called by scheduled job
   *
   * @param workAgreementId - Work agreement ID
   */
  async publishDelayedReviews(workAgreementId: number): Promise<void> {
    this.logger.log(
      `Publishing delayed reviews for agreement ${workAgreementId}`,
    );

    const reviews = await this.prisma.review.findMany({
      where: {
        workAgreementId,
        status: 'PENDING',
      },
    });

    if (reviews.length === 0) {
      this.logger.warn(`No pending reviews found for agreement ${workAgreementId}`);
      return;
    }

    // Publish all pending reviews
    await this.prisma.review.updateMany({
      where: {
        workAgreementId,
        status: 'PENDING',
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        auditLog: this.createAuditLog('PUBLISH', {
          method: 'delayed_publication',
        }),
      },
    });

    // Invalidate cache for all reviewees
    const revieweeIds = [...new Set(reviews.map((r) => r.revieweeId))];
    await Promise.all(
      revieweeIds.map((id) => this.reputationService.invalidateCache(id)),
    );

    this.logger.log(
      `Published ${reviews.length} review(s) for agreement ${workAgreementId}`,
    );
  }

  /**
   * Get review by ID
   *
   * @param reviewId - Review ID
   * @param userId - User ID (for authorization check)
   * @returns Review data
   */
  async getReview(reviewId: number, userId?: number) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        workAgreement: {
          include: {
            application: {
              include: {
                jobPosting: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only published reviews are public
    if (review.status !== 'PUBLISHED') {
      // Only reviewer, reviewee, or admin can view unpublished reviews
      if (
        !userId ||
        (review.reviewerId !== userId &&
          review.revieweeId !== userId &&
          review.reviewer.role !== 'ADMIN')
      ) {
        throw new NotFoundException('Review not found');
      }
    }

    return review;
  }

  /**
   * Get reviews for a user
   *
   * @param userId - User ID to get reviews for
   * @param status - Filter by status (optional)
   * @param limit - Max results
   * @param offset - Results to skip
   * @returns Array of reviews
   */
  async getUserReviews(
    userId: number,
    status?: string,
    limit = 10,
    offset = 0,
  ) {
    const where: any = { revieweeId: userId };

    if (status) {
      where.status = status;
    } else {
      // Default to published reviews for public view
      where.status = 'PUBLISHED';
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          reviewer: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      limit,
      offset,
    };
  }

  /**
   * Update review (before publication only)
   *
   * @param reviewId - Review ID
   * @param userId - User updating the review
   * @param updateReviewDto - Update data
   * @returns Updated review
   */
  async updateReview(
    reviewId: number,
    userId: number,
    updateReviewDto: UpdateReviewDto,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only reviewer can update
    if (review.reviewerId !== userId) {
      throw new BadRequestException(
        'You can only update your own reviews',
      );
    }

    // Can only update PENDING reviews
    if (review.status !== 'PENDING') {
      throw new BadRequestException(
        'Can only update reviews that have not been published',
      );
    }

    // Cannot change overall rating after submission
    if (updateReviewDto.overallRating && updateReviewDto.overallRating !== review.overallRating) {
      throw new BadRequestException('Cannot change overall rating after submission');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...updateReviewDto,
        auditLog: this.appendAuditLog(review.auditLog, 'UPDATE', {
          fields: Object.keys(updateReviewDto),
        }),
      },
    });

    this.logger.log(`Review ${reviewId} updated`);

    return updatedReview;
  }

  /**
   * Respond to a review
   *
   * @param reviewId - Review ID
   * @param userId - User responding (must be reviewee)
   * @param respondReviewDto - Response data
   * @returns Updated review
   */
  async respondToReview(
    reviewId: number,
    userId: number,
    respondReviewDto: RespondReviewDto,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only reviewee can respond
    if (review.revieweeId !== userId) {
      throw new BadRequestException('You can only respond to reviews about you');
    }

    // Can only respond to published reviews
    if (review.status !== 'PUBLISHED') {
      throw new BadRequestException('Can only respond to published reviews');
    }

    // Check if response already exists
    if (review.response) {
      throw new ConflictException('You have already responded to this review');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        response: respondReviewDto.response,
        responseSubmittedAt: new Date(),
        auditLog: this.appendAuditLog(review.auditLog, 'RESPOND', {
          responseLength: respondReviewDto.response.length,
        }),
      },
    });

    this.logger.log(`Response added to review ${reviewId}`);

    return updatedReview;
  }

  /**
   * Delete review (soft delete by hiding)
   *
   * @param reviewId - Review ID
   * @param userId - User requesting deletion
   */
  async deleteReview(reviewId: number, userId: number): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only reviewer can delete their own review
    if (review.reviewerId !== userId) {
      throw new BadRequestException('You can only delete your own reviews');
    }

    // Can only delete PENDING reviews
    if (review.status !== 'PENDING') {
      throw new BadRequestException(
        'Cannot delete published reviews. Contact support for assistance.',
      );
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    this.logger.log(`Review ${reviewId} deleted by user ${userId}`);
  }

  /**
   * Calculate days since a date
   *
   * @param date - Date to calculate from
   * @returns Number of days
   */
  private daysSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Create audit log entry
   *
   * @param action - Action performed
   * @param details - Action details
   * @returns Audit log array
   */
  private createAuditLog(action: string, details: any): any[] {
    return [
      {
        action,
        timestamp: new Date().toISOString(),
        details,
      },
    ];
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
