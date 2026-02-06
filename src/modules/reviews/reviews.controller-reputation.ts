import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReputationService } from './services/reputation.service';
import { BadgeService } from './services/badge.service';

/**
 * Reputation Controller
 * Public and protected endpoints for reputation and badge queries
 */
@ApiTags('reputation')
@Controller('reputation')
export class ReviewsControllerReputation {
  constructor(
    private readonly reputationService: ReputationService,
    private readonly badgeService: BadgeService,
  ) {}

  /**
   * Get user reputation data
   */
  @Get('users/:userId')
  @ApiOperation({
    summary: 'Get user reputation',
    description: 'Get complete reputation data including ratings, reviews, and prestige level',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getUserReputation(@Param('userId') userId: string) {
    return this.reputationService.getUserReputation(parseInt(userId));
  }

  /**
   * Recalculate user reputation (admin)
   */
  @Post('users/:userId/recalculate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Recalculate reputation',
    description: 'Force recalculation of user reputation (admin only)',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async recalculateReputation(@Param('userId') userId: string) {
    return this.reputationService.recalculateReputation(parseInt(userId));
  }

  /**
   * Get business badge status
   */
  @Get('businesses/:businessId/badge')
  @ApiOperation({
    summary: 'Get business badge status',
    description: 'Get Good Employer badge status and criteria for a business',
  })
  @ApiParam({ name: 'businessId', description: 'Business profile ID' })
  async getBusinessBadge(@Param('businessId') businessId: string) {
    return this.badgeService.getBadgeStatus(parseInt(businessId));
  }
}
