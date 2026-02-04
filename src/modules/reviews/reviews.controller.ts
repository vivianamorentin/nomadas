import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a review' })
  async createReview(@Request() req, @Body() createDto: any) {
    return this.reviewsService.create(req.user.userId, createDto);
  }

  @Get('profiles/:profileId')
  @ApiOperation({ summary: 'Get reviews for profile' })
  async getProfileReviews(@Param('profileId') profileId: string) {
    return this.reviewsService.findByProfileId(parseInt(profileId));
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review visibility' })
  async updateReview(@Param('id') id: string, @Body('visible') visible: boolean) {
    return this.reviewsService.updateVisibility(parseInt(id), visible);
  }
}
