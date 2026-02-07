import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MapClusteringService } from './map-clustering.service';
import { SearchJobsDto } from './dto';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { User } from '../identity/decorators/user.decorator';

@ApiTags('Job Map')
@Controller('jobs/map')
export class JobMapController {
  constructor(private readonly mapClusteringService: MapClusteringService) {}

  /**
   * Public endpoint - Get job clusters for map viewport
   */
  @Get('clusters')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get job clusters for map viewport',
    description: 'Returns clustered job markers for efficient map visualization. Uses grid-based clustering algorithm.',
  })
  @ApiQuery({ name: 'north', required: true, description: 'North latitude bound', example: 41.5 })
  @ApiQuery({ name: 'south', required: true, description: 'South latitude bound', example: 41.3 })
  @ApiQuery({ name: 'east', required: true, description: 'East longitude bound', example: 2.3 })
  @ApiQuery({ name: 'west', required: true, description: 'West longitude bound', example: 2.1 })
  @ApiQuery({ name: 'zoom', required: true, description: 'Map zoom level (1-20)', example: 12 })
  @ApiResponse({
    status: 200,
    description: 'Job clusters',
    schema: {
      example: {
        clusters: [
          {
            id: '1234_5678',
            latitude: 41.3851,
            longitude: 2.1734,
            job_count: 15,
            job_ids: [1, 2, 3, 4, 5],
            categories: ['FOOD_SERVICE', 'HOUSEKEEPING'],
            compensation_range: { min: 300, max: 500 },
          },
        ],
        total_jobs: 150,
        cluster_count: 12,
        truncated: false,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid bounds or zoom level' })
  async getClusters(
    @Query('north') north: string,
    @Query('south') south: string,
    @Query('east') east: string,
    @Query('west') west: string,
    @Query('zoom') zoom: string,
    @Query() filters?: SearchJobsDto
  ) {
    const bounds = {
      north: parseFloat(north),
      south: parseFloat(south),
      east: parseFloat(east),
      west: parseFloat(west),
    };

    // Validate bounds
    if (
      isNaN(bounds.north) ||
      isNaN(bounds.south) ||
      isNaN(bounds.east) ||
      isNaN(bounds.west) ||
      bounds.north <= bounds.south ||
      bounds.east <= bounds.west
    ) {
      throw new Error('Invalid map bounds');
    }

    // Validate zoom
    const zoomLevel = parseInt(zoom);
    if (isNaN(zoomLevel) || zoomLevel < 1 || zoomLevel > 20) {
      throw new Error('Invalid zoom level. Must be between 1 and 20.');
    }

    return this.mapClusteringService.getClustersForViewport({
      bounds,
      zoom: zoomLevel,
      filters,
    });
  }

  /**
   * Public endpoint - Get individual jobs in viewport
   */
  @Get('jobs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get jobs in map viewport',
    description: 'Returns individual job details for jobs within the specified map bounds. Useful for high zoom levels.',
  })
  @ApiQuery({ name: 'north', required: true, description: 'North latitude bound', example: 41.5 })
  @ApiQuery({ name: 'south', required: true, description: 'South latitude bound', example: 41.3 })
  @ApiQuery({ name: 'east', required: true, description: 'East longitude bound', example: 2.3 })
  @ApiQuery({ name: 'west', required: true, description: 'West longitude bound', example: 2.1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum jobs to return', example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Jobs in viewport',
    schema: {
      example: {
        jobs: [
          {
            id: 1,
            title: 'Summer Server',
            description: 'Join our beach restaurant...',
            category: 'FOOD_SERVICE',
            compensationMin: 300,
            compensationMax: 400,
            locations: [
              {
                id: 1,
                latitude: 41.3851,
                longitude: 2.1734,
                city: 'Barcelona',
                country: 'Spain',
              },
            ],
            businessProfile: {
              businessName: 'Sunset Beach Bar',
              locationCity: 'Barcelona',
              prestigeLevel: 'GOLD',
              averageRating: 4.5,
              hasGoodEmployerBadge: true,
            },
          },
        ],
        total: 42,
        limit: 50,
      },
    },
  })
  async getJobsInViewport(
    @Query('north') north: string,
    @Query('south') south: string,
    @Query('east') east: string,
    @Query('west') west: string,
    @Query('limit') limit?: string,
    @Query() filters?: SearchJobsDto
  ) {
    const bounds = {
      north: parseFloat(north),
      south: parseFloat(south),
      east: parseFloat(east),
      west: parseFloat(west),
    };

    // Validate bounds
    if (
      isNaN(bounds.north) ||
      isNaN(bounds.south) ||
      isNaN(bounds.east) ||
      isNaN(bounds.west) ||
      bounds.north <= bounds.south ||
      bounds.east <= bounds.west
    ) {
      throw new Error('Invalid map bounds');
    }

    const jobLimit = limit ? parseInt(limit) : 100;
    const jobs = await this.mapClusteringService.getJobsInViewport(bounds, filters, jobLimit);

    return {
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        category: job.category,
        workType: job.workType,
        startDate: job.startDate,
        endDate: job.endDate,
        compensationMin: job.compensationMin,
        compensationMax: job.compensationMax,
        accommodationIncluded: job.accommodationIncluded,
        mealsIncluded: job.mealsIncluded,
        locations: job.locations,
        businessProfile: job.businessProfile,
        status: job.status,
        viewCount: job.viewCount,
      })),
      total: jobs.length,
      limit: jobLimit,
    };
  }

  /**
   * Worker endpoint - Track map view analytics
   */
  @Post('track-view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Track map view analytics',
    description: 'Record which jobs were viewed from the map. Updates view counts and analytics.',
  })
  @ApiResponse({ status: 200, description: 'View tracking successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async trackMapView(
    @User() user: any,
    @Body() body: { jobIds: number[] }
  ) {
    if (!body.jobIds || !Array.isArray(body.jobIds)) {
      throw new Error('jobIds must be an array');
    }

    if (body.jobIds.length === 0) {
      throw new Error('jobIds cannot be empty');
    }

    if (body.jobIds.length > 100) {
      throw new Error('Cannot track more than 100 jobs at once');
    }

    await this.mapClusteringService.trackMapView(
      body.jobIds,
      'WORKER',
      user.userId
    );

    return {
      message: 'Map view tracking successful',
      tracked_count: body.jobIds.length,
    };
  }
}
