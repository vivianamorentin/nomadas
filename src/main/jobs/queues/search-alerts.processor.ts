import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { SavedSearchService } from '../saved-search.service';
import { JobStatus } from '@prisma/client';

/**
 * Search Alerts Processor
 * Sends notifications for new matching jobs
 * SPEC-JOB-001 Phase 6
 */
@Processor('search-alerts')
export class SearchAlertsProcessor {
  private readonly logger = new Logger(SearchAlertsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly savedSearchService: SavedSearchService
  ) {}

  /**
   * Process search alerts queue
   * Runs hourly to check for new matching jobs
   */
  @Process('send-search-alerts')
  async handleSendSearchAlerts(job: Job) {
    try {
      this.logger.log('Starting search alerts processing...');

      // Get all saved searches with notifications enabled
      const savedSearches = await this.savedSearchService.getSearchesForNotification();

      this.logger.log(`Processing ${savedSearches.length} saved searches`);

      let notificationsSent = 0;

      // Process each saved search
      for (const savedSearch of savedSearches) {
        // Check for new jobs posted since last notification
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Build search query from saved filters
        const searchFilters = savedSearch.search_filters;

        // Find jobs matching the search criteria
        const matchingJobs = await this.findMatchingJobs(searchFilters, oneHourAgo);

        if (matchingJobs.length > 0) {
          // Send notification email
          await this.sendNotificationEmail(
            savedSearch.worker_email,
            savedSearch.name,
            matchingJobs
          );

          notificationsSent++;
        }
      }

      this.logger.log(`Sent ${notificationsSent} search alert notifications`);

      return {
        success: true,
        processed: savedSearches.length,
        notifications_sent: notificationsSent,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error processing search alerts', error);
      throw error;
    }
  }

  /**
   * Find jobs matching saved search criteria
   */
  private async findMatchingJobs(searchFilters: any, postedAfter: Date) {
    try {
      const where: any = {
        status: JobStatus.ACTIVE,
        createdAt: {
          gte: postedAfter,
        },
      };

      // Apply filters from saved search
      if (searchFilters.categories && searchFilters.categories.length > 0) {
        where.category = { in: searchFilters.categories };
      }

      if (searchFilters.workType) {
        where.workType = searchFilters.workType;
      }

      if (searchFilters.compensationMin !== undefined) {
        where.compensationMin = { gte: searchFilters.compensationMin };
      }

      if (searchFilters.compensationMax !== undefined) {
        where.compensationMax = { lte: searchFilters.compensationMax };
      }

      if (searchFilters.accommodationIncluded !== undefined) {
        where.accommodationIncluded = searchFilters.accommodationIncluded;
      }

      if (searchFilters.mealsIncluded !== undefined) {
        where.mealsIncluded = searchFilters.mealsIncluded;
      }

      const jobs = await this.prisma.jobPosting.findMany({
        where,
        include: {
          businessProfile: {
            select: {
              businessName: true,
              locationCity: true,
              locationCountry: true,
            },
          },
          locations: {
            take: 1,
          },
        },
        take: 20, // Limit to 20 jobs per notification
        orderBy: { createdAt: 'desc' },
      });

      return jobs;
    } catch (error) {
      this.logger.error('Error finding matching jobs', error);
      return [];
    }
  }

  /**
   * Send notification email to worker
   * TODO: Integrate with email service
   */
  private async sendNotificationEmail(
    email: string,
    searchName: string,
    jobs: any[]
  ) {
    try {
      // TODO: Implement email sending
      this.logger.debug(
        `Sending search alert email to ${email} for search "${searchName}" with ${jobs.length} new jobs`
      );

      // Placeholder for email service integration
      // await this.emailService.send({
      //   to: email,
      //   subject: `New jobs matching "${searchName}"`,
      //   template: 'search-alert',
      //   context: { jobs, searchName },
      // });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error sending notification email to ${email}`, error);
      return { success: false };
    }
  }
}
