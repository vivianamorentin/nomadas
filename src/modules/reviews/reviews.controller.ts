import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { ReviewService } from './services/review.service';
import { ModerationService } from './services/moderation.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  RespondReviewDto,
  FlagReviewDto,
  ReviewFilterDto,
} from './dto';

/**
 * Reviews Controller
 * Public and protected endpoints for review management
 */
@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly moderationService: ModerationService,
  ) {}

  /**
   * Submit a review for a completed work agreement
   */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit a review',
    description: 'Submit a review for a completed work agreement. Must be within 14 days of agreement end.',
  })
  async createReview(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.submitReview(req.user.userId, createReviewDto);
  }

  /**
   * Get a review by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get review by ID',
    description: 'Get a single review by ID. Published reviews are public. Unpublished reviews require authorization.',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  async getReview(@Param('id') id: string, @Request() req) {
    const userId = req.user?.userId;
    return this.reviewService.getReview(parseInt(id), userId);
  }

  /**
   * Get reviews for a user
   */
  @Get('users/:userId')
  @ApiOperation({
    summary: "Get user's reviews",
    description: 'Get reviews received by a user. Defaults to published reviews only.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results (default: 10)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Results to skip (default: 0)' })
  async getUserReviews(
    @Param('userId') userId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reviewService.getUserReviews(
      parseInt(userId),
      status,
      limit ? parseInt(limit) : 10,
      offset ? parseInt(offset) : 0,
    );
  }

  /**
   * Update a review (before publication only)
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update review',
    description: 'Update review content. Only possible before publication. Cannot change overall rating.',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  async updateReview(
    @Param('id') id: string,
    @Request() req,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewService.updateReview(
      parseInt(id),
      req.user.userId,
      updateReviewDto,
    );
  }

  /**
   * Respond to a review
   */
  @Post(':id/respond')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Respond to review',
    description: 'Submit a response to a review you received. Only one response allowed.',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  async respondToReview(
    @Param('id') id: string,
    @Request() req,
    @Body() respondReviewDto: RespondReviewDto,
  ) {
    return this.reviewService.respondToReview(
      parseInt(id),
      req.user.userId,
      respondReviewDto,
    );
  }

  /**
   * Flag a review for moderation
   */
  @Post(':id/flag')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Flag review',
    description: 'Flag a review for moderation. Provide category and optional comment.',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  async flagReview(
    @Param('id') id: string,
    @Request() req,
    @Body() flagReviewDto: FlagReviewDto,
  ) {
    return this.moderationService.flagReview(
      parseInt(id),
      req.user.userId,
      flagReviewDto,
    );
  }

  /**
   * Delete a review (before publication only)
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete review',
    description: 'Delete your own review. Only possible before publication.',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  async deleteReview(@Param('id') id: string, @Request() req) {
    return this.reviewService.deleteReview(parseInt(id), req.user.userId);
  }
}
