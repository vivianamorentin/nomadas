import { Injectable, Logger } from '@nestjs/common';
import { OpenSearchService } from '../../shared/infrastructure/search/opensearch.service';
import { PrismaService } from '../../shared/infrastructure/database/prisma.service';
import { SearchJobsDto } from './dto';
import { JobStatus, WorkType, JobCategory } from '@prisma/client';

/**
 * Job Search Service
 * Wraps OpenSearch with business logic, analytics tracking, and faceted search
 * SPEC-JOB-001 Phase 3
 */
@Injectable()
export class JobSearchService {
  private readonly logger = new Logger(JobSearchService.name);

  constructor(
    private readonly openSearch: OpenSearchService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Search jobs with advanced filters
   * Tracks search analytics for optimization
   */
  async search(searchDto: SearchJobsDto, userId?: number) {
    try {
      // Build search parameters from DTO
      const searchParams = this.buildSearchParams(searchDto);

      // Execute search
      const results = await this.openSearch.searchJobs(searchParams);

      // Track search analytics (async, don't block)
      if (userId) {
        this.trackSearch(userId, searchDto, results.hits).catch((error) => {
          this.logger.error('Failed to track search analytics', error);
        });
      }

      return {
        ...results,
        filters_applied: this.summarizeAppliedFilters(searchDto),
      };
    } catch (error) {
      this.logger.error('Error searching jobs', error);
      throw error;
    }
  }

  /**
   * Get faceted search results (counts by category)
   * Helps users understand job distribution
   */
  async getFacets(baseFilters: any) {
    try {
      const categories = Object.values(JobCategory);
      const facets = {};

      // Get count for each category
      for (const category of categories) {
        const searchParams = {
          ...baseFilters,
          categories: [category],
          page: 1,
          limit: 0, // Just get count, not results
        };

        const results = await this.openSearch.searchJobs(searchParams);
        facets[category] = results.hits;
      }

      return facets;
    } catch (error) {
      this.logger.error('Error getting facets', error);
      throw error;
    }
  }

  /**
   * Get popular searches (based on recent search analytics)
   * Helps new users discover relevant jobs
   */
  async getPopularSearches(limit: number = 10) {
    try {
      // Aggregate recent searches and return top queries
      // This is a simplified version - in production, use Redis aggregation
      const popularSearches = await this.prisma.jobView.groupBy({
        by: ['jobPostingId'],
        where: {
          viewedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        _count: {
          jobPostingId: true,
        },
        orderBy: {
          _count: {
            jobPostingId: 'desc',
          },
        },
        take: limit,
      });

      // Get job details for popular searches
      const jobIds = popularSearches.map((s) => s.jobPostingId);
      const jobs = await this.prisma.jobPosting.findMany({
        where: {
          id: { in: jobIds },
          status: JobStatus.ACTIVE,
        },
        include: {
          businessProfile: {
            select: {
              businessName: true,
              locationCity: true,
              locationCountry: true,
            },
          },
        },
      });

      return jobs.map((job) => ({
        id: job.id,
        title: job.title,
        category: job.category,
        city: job.businessProfile.locationCity,
        country: job.businessProfile.locationCountry,
        view_count: popularSearches.find((s) => s.jobPostingId === job.id)?._count.jobPostingId,
      }));
    } catch (error) {
      this.logger.error('Error getting popular searches', error);
      throw error;
    }
  }

  /**
   * Get similar jobs based on job characteristics
   * Useful for "You might also like" recommendations
   */
  async getSimilarJobs(jobId: number, limit: number = 5) {
    try {
      // Get the reference job
      const job = await this.prisma.jobPosting.findUnique({
        where: { id: jobId },
        include: { locations: true },
      });

      if (!job) {
        return [];
      }

      // Build search based on similar characteristics
      const primaryLocation = job.locations[0];
      const searchParams = {
        categories: [job.category],
        workType: job.workType,
        lat: primaryLocation?.latitude,
        lon: primaryLocation?.longitude,
        radius: '50km',
        limit: limit + 1, // +1 to exclude the job itself
      };

      const results = await this.openSearch.searchJobs(searchParams);

      // Exclude the job itself and return results
      return results.jobs
        .filter((j: any) => j.id !== jobId)
        .slice(0, limit)
        .map((j: any) => ({
          id: j.id,
          title: j.title,
          category: j.category,
          city: j.businessCity,
          country: j.businessCountry,
          compensationMin: j.compensationMin,
          compensationMax: j.compensationMax,
          score: j.score,
        }));
    } catch (error) {
      this.logger.error(`Error getting similar jobs for job ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Build search parameters from DTO
   */
  private buildSearchParams(searchDto: SearchJobsDto) {
    const params: any = {
      page: searchDto.page || 1,
      limit: Math.min(searchDto.limit || 20, 20), // Max 20 per page (BR-SEARCH-003)
    };

    // Text search
    if (searchDto.query) {
      params.query = searchDto.query;
    }

    // Category filters
    if (searchDto.categories && searchDto.categories.length > 0) {
      params.categories = searchDto.categories;
    }

    // Work type filter
    if (searchDto.workType) {
      params.workType = searchDto.workType;
    }

    // Geospatial search
    if (searchDto.lat && searchDto.lon) {
      params.lat = searchDto.lat;
      params.lon = searchDto.lon;
      params.radius = searchDto.radius || '25km';
    }

    // Date filters
    if (searchDto.startDateFrom) {
      params.startDateFrom = searchDto.startDateFrom;
    }
    if (searchDto.startDateTo) {
      params.startDateTo = searchDto.startDateTo;
    }

    // Duration filters
    if (searchDto.durationMin !== undefined) {
      params.durationMin = searchDto.durationMin;
    }
    if (searchDto.durationMax !== undefined) {
      params.durationMax = searchDto.durationMax;
    }
    if (searchDto.durationUnit) {
      params.durationUnit = searchDto.durationUnit;
    }

    // Compensation filters
    if (searchDto.compensationMin !== undefined) {
      params.compensationMin = searchDto.compensationMin;
    }
    if (searchDto.compensationMax !== undefined) {
      params.compensationMax = searchDto.compensationMax;
    }
    if (searchDto.compensationCurrency) {
      params.compensationCurrency = searchDto.compensationCurrency;
    }
    if (searchDto.compensationType) {
      params.compensationType = searchDto.compensationType;
    }

    // Language filter
    if (searchDto.languages && searchDto.languages.length > 0) {
      params.languages = searchDto.languages;
    }

    // Skills filter
    if (searchDto.skills && searchDto.skills.length > 0) {
      params.skills = searchDto.skills;
    }

    // Experience filter
    if (searchDto.requiredExperience) {
      params.requiredExperience = searchDto.requiredExperience;
    }

    // Benefits filters
    if (searchDto.accommodationIncluded !== undefined) {
      params.accommodationIncluded = searchDto.accommodationIncluded;
    }
    if (searchDto.mealsIncluded !== undefined) {
      params.mealsIncluded = searchDto.mealsIncluded;
    }

    // Sorting
    if (searchDto.sort) {
      params.sort = searchDto.sort;
    }

    return params;
  }

  /**
   * Summarize applied filters for UI display
   */
  private summarizeAppliedFilters(searchDto: SearchJobsDto): any {
    const filters = {};

    if (searchDto.categories) filters.categories = searchDto.categories;
    if (searchDto.workType) filters.workType = searchDto.workType;
    if (searchDto.lat && searchDto.lon) {
      filters.location = {
        lat: searchDto.lat,
        lon: searchDto.lon,
        radius: searchDto.radius || '25km',
      };
    }
    if (searchDto.compensationMin !== undefined || searchDto.compensationMax !== undefined) {
      filters.compensation = {
        min: searchDto.compensationMin,
        max: searchDto.compensationMax,
        currency: searchDto.compensationCurrency,
      };
    }
    if (searchDto.languages) filters.languages = searchDto.languages;
    if (searchDto.skills) filters.skills = searchDto.skills;
    if (searchDto.requiredExperience) filters.experience = searchDto.requiredExperience;
    if (searchDto.accommodationIncluded !== undefined) {
      filters.accommodation = searchDto.accommodationIncluded;
    }
    if (searchDto.mealsIncluded !== undefined) filters.meals = searchDto.mealsIncluded;

    return filters;
  }

  /**
   * Track search analytics
   * Stores search queries for analysis and optimization
   */
  private async trackSearch(userId: number, searchDto: SearchJobsDto, resultCount: number) {
    try {
      // Store search analytics
      // In production, use a separate analytics table or Redis
      this.logger.debug(`Search tracked for user ${userId}: ${resultCount} results`);

      // TODO: Implement proper search analytics storage
      // For now, just log
    } catch (error) {
      this.logger.error('Failed to track search analytics', error);
    }
  }
}
