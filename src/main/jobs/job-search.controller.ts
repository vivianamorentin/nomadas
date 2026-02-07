import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JobSearchService } from './job-search.service';
import { SavedJobService } from './saved-job.service';
import { SavedSearchService } from './saved-search.service';
import { SearchJobsDto, CreateSavedSearchDto, UpdateSavedSearchDto } from './dto';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { User } from '../identity/decorators/user.decorator';

@ApiTags('Job Search')
@Controller('jobs')
export class JobSearchController {
  constructor(
    private readonly jobSearchService: JobSearchService,
    private readonly savedJobService: SavedJobService,
    private readonly savedSearchService: SavedSearchService,
  ) {}

  /**
   * Public endpoint - Advanced job search
   */
  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search jobs with advanced filters',
    description: 'Search for job postings with comprehensive filtering options including location, category, compensation, skills, and more.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    schema: {
      example: {
        hits: 42,
        jobs: [
          {
            id: 1,
            title: 'Summer Server',
            score: 2.5,
            distanceKm: 12.3,
            // ... other job fields
          },
        ],
        page: 1,
        limit: 20,
        totalPages: 3,
        filters_applied: {
          categories: ['FOOD_SERVICE'],
          location: { lat: 41.3851, lon: 2.1734, radius: '25km' },
        },
      },
    },
  })
  async searchJobs(@Query() searchDto: SearchJobsDto, @User() user?: any) {
    return this.jobSearchService.search(searchDto, user?.userId);
  }

  /**
   * Public endpoint - Get faceted search counts
   */
  @Get('search/facets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get job counts by category',
    description: 'Returns the number of active jobs in each category for faceted navigation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Facet counts',
    schema: {
      example: {
        FOOD_SERVICE: 150,
        HOUSEKEEPING: 85,
        ENTERTAINMENT: 42,
        MAINTENANCE: 30,
      },
    },
  })
  async getFacets(@Query() baseFilters: any) {
    return this.jobSearchService.getFacets(baseFilters);
  }

  /**
   * Public endpoint - Get popular searches
   */
  @Get('search/popular')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get popular job searches',
    description: 'Returns the most viewed jobs in the last 7 days to help new users discover opportunities.',
  })
  @ApiResponse({
    status: 200,
    description: 'Popular searches',
    schema: {
      example: {
        popular_searches: [
          {
            id: 1,
            title: 'Summer Server - Beach Restaurant',
            category: 'FOOD_SERVICE',
            city: 'Barcelona',
            country: 'Spain',
            view_count: 523,
          },
        ],
      },
    },
  })
  async getPopularSearches(@Query('limit') limit?: number) {
    return this.jobSearchService.getPopularSearches(limit);
  }

  /**
   * Public endpoint - Get similar jobs
   */
  @Get(':id/similar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get similar jobs',
    description: 'Returns jobs similar to the specified job based on category, location, and other characteristics.',
  })
  @ApiParam({ name: 'id', description: 'Job posting ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Similar jobs',
    schema: {
      example: {
        similar_jobs: [
          {
            id: 2,
            title: 'Restaurant Server - Summer Season',
            category: 'FOOD_SERVICE',
            city: 'Barcelona',
            country: 'Spain',
            compensationMin: 320,
            compensationMax: 410,
            score: 1.8,
          },
        ],
      },
    },
  })
  async getSimilarJobs(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.jobSearchService.getSimilarJobs(+id, limit);
  }

  /**
   * Worker endpoint - Save a job
   */
  @Post('saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Save a job',
    description: 'Bookmark a job for later viewing. Maximum 100 saved jobs per worker.',
  })
  @ApiResponse({ status: 201, description: 'Job saved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - job already saved or limit reached' })
  @ApiResponse({ status: 404, description: 'Job or worker profile not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async saveJob(
    @User() user: any,
    @Body() body: { jobPostingId: number; notes?: string }
  ) {
    return this.savedJobService.saveJob(user.userId, body.jobPostingId, body.notes);
  }

  /**
   * Worker endpoint - Remove saved job
   */
  @Delete('saved/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove saved job',
    description: 'Remove a job from the worker saved jobs list.',
  })
  @ApiParam({ name: 'id', description: 'Saved job ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Saved job removed successfully' })
  @ApiResponse({ status: 404, description: 'Saved job not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your saved job' })
  async removeSavedJob(@User() user: any, @Param('id') id: string) {
    return this.savedJobService.removeSavedJob(user.userId, +id);
  }

  /**
   * Worker endpoint - Get saved jobs
   */
  @Get('saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get saved jobs',
    description: 'Returns a paginated list of jobs saved by the worker.',
  })
  @ApiResponse({
    status: 200,
    description: 'Saved jobs list',
    schema: {
      example: {
        saved_jobs: [
          {
            id: 1,
            notes: 'Interested in this position',
            savedAt: '2024-06-01',
            job: {
              id: 1,
              title: 'Summer Server',
              category: 'FOOD_SERVICE',
              // ... other job fields
            },
          },
        ],
        total: 5,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    },
  })
  async getSavedJobs(
    @User() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string
  ) {
    return this.savedJobService.getSavedJobs(user.userId, { page, limit, sort });
  }

  /**
   * Worker endpoint - Update saved job notes
   */
  @Patch('saved/:id/notes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update saved job notes',
    description: 'Update the private notes for a saved job.',
  })
  @ApiParam({ name: 'id', description: 'Saved job ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Notes updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your saved job' })
  async updateSavedJobNotes(
    @User() user: any,
    @Param('id') id: string,
    @Body() body: { notes: string }
  ) {
    return this.savedJobService.updateNotes(user.userId, +id, body.notes);
  }

  /**
   * Worker endpoint - Check if job is saved
   */
  @Get(':id/saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check if job is saved',
    description: 'Returns true if the job is in the worker saved jobs list.',
  })
  @ApiParam({ name: 'id', description: 'Job posting ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Saved status',
    schema: {
      example: {
        is_saved: true,
      },
    },
  })
  async isJobSaved(@User() user: any, @Param('id') id: string) {
    const isSaved = await this.savedJobService.isJobSaved(user.userId, +id);
    return { is_saved: isSaved };
  }

  /**
   * Worker endpoint - Save search alert
   */
  @Post('searches/saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Save search alert',
    description: 'Save a search query to receive notifications when new matching jobs are posted.',
  })
  @ApiResponse({ status: 201, description: 'Search saved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async saveSearch(@User() user: any, @Body() createDto: CreateSavedSearchDto) {
    return this.savedSearchService.saveSearch(
      user.userId,
      createDto.name,
      createDto.searchFilters
    );
  }

  /**
   * Worker endpoint - Get saved searches
   */
  @Get('searches/saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get saved searches',
    description: 'Returns all saved search alerts for the worker.',
  })
  @ApiResponse({
    status: 200,
    description: 'Saved searches list',
    schema: {
      example: {
        saved_searches: [
          {
            id: 1,
            name: 'Summer jobs in Barcelona',
            search_filters: {
              categories: ['FOOD_SERVICE'],
              lat: 41.3851,
              lon: 2.1734,
              radius: '25km',
            },
            notification_enabled: true,
            last_used_at: '2024-06-01',
            created_at: '2024-05-15',
          },
        ],
        total: 3,
      },
    },
  })
  async getSavedSearches(@User() user: any) {
    return this.savedSearchService.getSavedSearches(user.userId);
  }

  /**
   * Worker endpoint - Execute saved search
   */
  @Post('searches/saved/:id/execute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute saved search',
    description: 'Execute a saved search and return matching jobs. Updates last used timestamp.',
  })
  @ApiParam({ name: 'id', description: 'Saved search ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Search executed' })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  async executeSavedSearch(@User() user: any, @Param('id') id: string) {
    return this.savedSearchService.executeSavedSearch(user.userId, +id);
  }

  /**
   * Worker endpoint - Update saved search
   */
  @Patch('searches/saved/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update saved search',
    description: 'Update name, filters, or notification settings for a saved search.',
  })
  @ApiParam({ name: 'id', description: 'Saved search ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Saved search updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your saved search' })
  async updateSavedSearch(
    @User() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateSavedSearchDto
  ) {
    return this.savedSearchService.updateSavedSearch(user.userId, +id, updateDto);
  }

  /**
   * Worker endpoint - Delete saved search
   */
  @Delete('searches/saved/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete saved search',
    description: 'Delete a saved search alert.',
  })
  @ApiParam({ name: 'id', description: 'Saved search ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Saved search deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your saved search' })
  async deleteSavedSearch(@User() user: any, @Param('id') id: string) {
    return this.savedSearchService.removeSavedSearch(user.userId, +id);
  }
}
