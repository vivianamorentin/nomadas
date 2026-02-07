import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MatchScoringService } from './match-scoring.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { User } from '../identity/decorators/user.decorator';

@ApiTags('Job Matches')
@Controller('jobs')
export class TopMatchesController {
  constructor(private readonly matchScoringService: MatchScoringService) {}

  /**
   * Business endpoint - Get top matching workers for a job
   */
  @Get(':id/matches/workers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get top matching workers for a job',
    description: 'Returns workers ranked by match score (0-100) with detailed score breakdowns. Useful for finding the best candidates.',
  })
  @ApiParam({ name: 'id', description: 'Job posting ID', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum workers to return', example: 20 })
  @ApiQuery({ name: 'minScore', required: false, description: 'Minimum match score (0-100)', example: 70 })
  @ApiResponse({
    status: 200,
    description: 'Top matching workers',
    schema: {
      example: {
        job_id: 1,
        total_candidates_evaluated: 150,
        matches_found: 42,
        top_matches: [
          {
            worker_id: 5,
            worker_name: 'John Doe',
            worker_rating: 4.5,
            availability_date: '2024-06-01',
            match_score: 92,
            is_good_match: true,
            is_excellent_match: true,
            breakdown: {
              location: { score: 100, details: { distance_km: 5.2 } },
              skills: { score: 85, details: { match_percentage: 85 } },
              compensation: { score: 95, details: {} },
              reputation: { score: 88, details: {} },
              other: { score: 90, details: {} },
            },
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTopMatchingWorkers(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('minScore') minScore?: string
  ) {
    return this.matchScoringService.getTopMatchingWorkers(
      +id,
      limit ? parseInt(limit) : 20,
      minScore ? parseFloat(minScore) : undefined
    );
  }

  /**
   * Worker endpoint - Get top matching jobs for a worker
   */
  @Get('matches/jobs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get top matching jobs for a worker',
    description: 'Returns jobs ranked by match score (0-100) with detailed score breakdowns. Helps workers find the best opportunities.',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum jobs to return', example: 20 })
  @ApiQuery({ name: 'minScore', required: false, description: 'Minimum match score (0-100)', example: 70 })
  @ApiResponse({
    status: 200,
    description: 'Top matching jobs',
    schema: {
      example: {
        worker_id: 5,
        total_jobs_evaluated: 320,
        matches_found: 85,
        top_matches: [
          {
            job_id: 1,
            title: 'Summer Server - Beach Restaurant',
            description: 'Join our vibrant team...',
            category: 'FOOD_SERVICE',
            workType: 'SEASONAL',
            startDate: '2024-06-01',
            endDate: '2024-08-31',
            compensationMin: 350,
            compensationMax: 450,
            location_city: 'Barcelona',
            location_country: 'Spain',
            business_name: 'Sunset Beach Bar',
            business_rating: 4.5,
            match_score: 94,
            is_good_match: true,
            is_excellent_match: true,
            breakdown: {
              location: { score: 100, details: { distance_km: 3.5 } },
              skills: { score: 90, details: { match_percentage: 90 } },
              compensation: { score: 88, details: {} },
              reputation: { score: 95, details: {} },
              other: { score: 92, details: {} },
            },
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Worker profile not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTopMatchingJobs(
    @User() user: any,
    @Query('limit') limit?: string,
    @Query('minScore') minScore?: string
  ) {
    // Get worker ID from user
    const worker = await this.prisma.workerProfile.findFirst({
      where: { userId: user.userId },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }

    return this.matchScoringService.getTopMatchingJobs(
      worker.id,
      limit ? parseInt(limit) : 20,
      minScore ? parseFloat(minScore) : undefined
    );
  }

  /**
   * Business endpoint - Calculate match score for specific worker-job pair
   */
  @Get(':id/matches/workers/:workerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate match score for worker-job pair',
    description: 'Returns detailed match score (0-100) with breakdown by factor. Shows why a worker is or isn\'t a good match.',
  })
  @ApiParam({ name: 'id', description: 'Job posting ID', example: 1 })
  @ApiParam({ name: 'workerId', description: 'Worker profile ID', example: 5 })
  @ApiResponse({
    status: 200,
    description: 'Match score details',
    schema: {
      example: {
        worker_id: 5,
        job_id: 1,
        match_score: 92,
        breakdown: {
          location: {
            score: 100,
            factor: 'Location proximity',
            details: {
              distance_km: 5.2,
              worker_location: { lat: 41.3851, lng: 2.1734 },
              job_locations: [{ lat: 41.39, lng: 2.18 }],
            },
          },
          skills: {
            score: 85,
            factor: 'Skills match',
            details: {
              required_skills: ['english', 'customer service'],
              worker_skills: ['english', 'customer service', 'team work'],
              matched_skills: 2,
              total_required: 2,
              match_percentage: 100,
            },
          },
          compensation: {
            score: 95,
            factor: 'Compensation fit',
            details: {
              worker_range: { min: 300, max: 500 },
              job_range: { min: 350, max: 450 },
              overlap: { min: 350, max: 450 },
            },
          },
          reputation: {
            score: 88,
            factor: 'Reputation',
            details: {
              worker_rating: 4.5,
              business_rating: 4.2,
              has_good_employer_badge: true,
            },
          },
          other: {
            score: 90,
            factor: 'Other factors',
            details: {
              experience_match: 40,
              language_match: 28,
              duration_match: 22,
            },
          },
        },
        is_good_match: true,
        is_excellent_match: true,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Job or worker not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async calculateMatchScore(
    @Param('id') id: string,
    @Param('workerId') workerId: string
  ) {
    return this.matchScoringService.calculateMatchScore(+workerId, +id);
  }

  /**
   * Worker endpoint - Calculate match score for specific job-worker pair
   */
  @Get('matches/:jobId/score')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate match score for job-worker pair',
    description: 'Returns detailed match score (0-100) with breakdown by factor from worker perspective.',
  })
  @ApiParam({ name: 'jobId', description: 'Job posting ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Match score details' })
  @ApiResponse({ status: 404, description: 'Job or worker not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async calculateMatchScoreForWorker(
    @User() user: any,
    @Param('jobId') jobId: string
  ) {
    // Get worker ID from user
    const worker = await this.prisma.workerProfile.findFirst({
      where: { userId: user.userId },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }

    return this.matchScoringService.calculateMatchScore(worker.id, +jobId);
  }
}
