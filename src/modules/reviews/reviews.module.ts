import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsControllerAdmin } from './reviews.controller-admin';
import { ReviewsControllerReputation } from './reviews.controller-reputation';
import { ReviewService } from './services/review.service';
import { ReputationService } from './services/reputation.service';
import { PrestigeCalculator } from './services/prestige-calculator.service';
import { ModerationService } from './services/moderation.service';
import { BadgeService } from './services/badge.service';

/**
 * Reputation Context
 * Handles reviews, ratings, prestige, and badges
 */
@Module({
  controllers: [
    ReviewsController,
    ReviewsControllerAdmin,
    ReviewsControllerReputation,
  ],
  providers: [
    ReviewService,
    ReputationService,
    PrestigeCalculator,
    ModerationService,
    BadgeService,
  ],
  exports: [
    ReviewService,
    ReputationService,
    PrestigeCalculator,
    ModerationService,
    BadgeService,
  ],
})
export class ReviewsModule {}
