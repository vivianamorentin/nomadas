import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

/**
 * Scheduled Tasks Service
 * Manages cron jobs for background task scheduling
 * SPEC-JOB-001 Phase 6
 */
@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    @InjectQueue('jobs-expiry') private readonly jobsExpiryQueue: Queue,
    @InjectQueue('searches-cleanup') private readonly searchesCleanupQueue: Queue,
    @InjectQueue('search-alerts') private readonly searchAlertsQueue: Queue
  ) {}

  /**
   * Daily job: Close expired jobs
   * Runs every day at 23:59 UTC (BR-JOB-007)
   */
  @Cron('59 23 * * *', {
    timeZone: 'UTC',
    name: 'close-expired-jobs',
  })
  async scheduleCloseExpiredJobs() {
    try {
      this.logger.log('Scheduling job expiry task...');

      await this.jobsExpiryQueue.add(
        'close-expired-jobs',
        {},
        {
          priority: 5,
        }
      );

      this.logger.log('Job expiry task scheduled successfully');
    } catch (error) {
      this.logger.error('Error scheduling job expiry task', error);
    }
  }

  /**
   * Weekly job: Archive old saved searches
   * Runs every Sunday at 02:00 UTC (BR-SEARCH-004)
   */
  @Cron(CronExpression.EVERY_WEEK, {
    timeZone: 'UTC',
    name: 'archive-old-searches',
  })
  async scheduleArchiveOldSearches() {
    try {
      this.logger.log('Scheduling search cleanup task...');

      await this.searchesCleanupQueue.add(
        'archive-old-searches',
        {},
        {
          priority: 3,
        }
      );

      this.logger.log('Search cleanup task scheduled successfully');
    } catch (error) {
      this.logger.error('Error scheduling search cleanup task', error);
    }
  }

  /**
   * Hourly job: Send search alert notifications
   * Runs every hour at minute 0
   */
  @Cron('0 * * * *', {
    timeZone: 'UTC',
    name: 'send-search-alerts',
  })
  async scheduleSendSearchAlerts() {
    try {
      this.logger.log('Scheduling search alerts task...');

      await this.searchAlertsQueue.add(
        'send-search-alerts',
        {},
        {
          priority: 7,
        }
      );

      this.logger.log('Search alerts task scheduled successfully');
    } catch (error) {
      this.logger.error('Error scheduling search alerts task', error);
    }
  }

  /**
   * Manual trigger for testing or admin use
   */
  async triggerJobExpiry() {
    return this.scheduleCloseExpiredJobs();
  }

  async triggerSearchCleanup() {
    return this.scheduleArchiveOldSearches();
  }

  async triggerSearchAlerts() {
    return this.scheduleSendSearchAlerts();
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const [expiryStats, cleanupStats, alertsStats] = await Promise.all([
        this.jobsExpiryQueue.getJobCounts(),
        this.searchesCleanupQueue.getJobCounts(),
        this.searchAlertsQueue.getJobCounts(),
      ]);

      return {
        jobs_expiry: expiryStats,
        searches_cleanup: cleanupStats,
        search_alerts: alertsStats,
      };
    } catch (error) {
      this.logger.error('Error getting queue stats', error);
      throw error;
    }
  }
}
