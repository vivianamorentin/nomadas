import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ModerationService } from './services/moderation.service';
import { BadgeService } from './services/badge.service';
import { ModerateReviewDto } from './dto';

/**
 * Admin Reviews Controller
 * Admin-only endpoints for review moderation and badge management
 */
@ApiTags('admin/reviews')
@Controller('admin/reviews')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ReviewsControllerAdmin {
  constructor(
    private readonly moderationService: ModerationService,
    private readonly badgeService: BadgeService,
  ) {}

  /**
   * Get all flagged reviews pending moderation
   */
  @Get('flagged')
  @ApiOperation({
    summary: 'Get flagged reviews',
    description: 'Get all flagged reviews pending moderation review',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results (default: 20)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Results to skip (default: 0)' })
  async getFlaggedReviews(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.moderationService.getFlaggedReviews(
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  /**
   * Moderate a flagged review
   */
  @Post(':id/moderate')
  @ApiOperation({
    summary: 'Moderate review',
    description: 'Take moderation action on a flagged review (APPROVE, HIDE, SUSPEND_USER)',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  async moderateReview(
    @Param('id') id: string,
    @Body() moderateReviewDto: ModerateReviewDto,
  ) {
    return this.moderationService.moderateReview(
      parseInt(id),
      moderateReviewDto,
    );
  }

  /**
   * Get moderation statistics
   */
  @Get('moderation/stats')
  @ApiOperation({
    summary: 'Get moderation stats',
    description: 'Get statistics about moderation queue and actions',
  })
  async getModerationStats() {
    return this.moderationService.getModerationStats();
  }

  /**
   * Trigger badge evaluation for all businesses
   */
  @Post('badges/evaluate')
  @ApiOperation({
    summary: 'Evaluate badges',
    description: 'Trigger Good Employer badge evaluation for all businesses',
  })
  async evaluateBadges() {
    return this.badgeService.evaluateAllBadges();
  }

  /**
   * Get badge statistics
   */
  @Get('badges/stats')
  @ApiOperation({
    summary: 'Get badge stats',
    description: 'Get statistics about Good Employer badges',
  })
  async getBadgeStats() {
    return this.badgeService.getBadgeStats();
  }

  /**
   * Unsuspend a user
   */
  @Post('users/:userId/unsuspend')
  @ApiOperation({
    summary: 'Unsuspend user',
    description: 'Unsuspend a user and restore their hidden reviews',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async unsuspendUser(@Param('userId') userId: string) {
    return this.moderationService.unsuspendUser(parseInt(userId));
  }
}
