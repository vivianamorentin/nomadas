import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { JobStatus } from '@prisma/client';

/**
 * Job Expiry Processor
 * Automatically closes jobs past their end date
 * SPEC-JOB-001 Phase 6
 */
@Processor('jobs-expiry')
export class JobExpiryProcessor {
  private readonly logger = new Logger(JobExpiryProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process job expiry queue
   * Runs daily to close expired jobs
   */
  @Process('close-expired-jobs')
  async handleCloseExpiredJobs(job: Job) {
    try {
      this.logger.log('Starting job expiry processing...');

      const now = new Date();

      // Find all active jobs past their end date
      const expiredJobs = await this.prisma.jobPosting.findMany({
        where: {
          status: {
            in: [JobStatus.ACTIVE, JobStatus.DRAFT],
          },
          endDate: {
            lt: now,
          },
        },
      });

      this.logger.log(`Found ${expiredJobs.length} expired jobs`);

      // Close all expired jobs
      let closedCount = 0;
      for (const expiredJob of expiredJobs) {
        await this.prisma.jobPosting.update({
          where: { id: expiredJob.id },
          data: {
            status: JobStatus.CLOSED,
            closedAt: now,
          },
        });

        // Remove from OpenSearch
        // TODO: Integrate with OpenSearchService
        closedCount++;
      }

      this.logger.log(`Closed ${closedCount} expired jobs`);

      return {
        success: true,
        processed: expiredJobs.length,
        closed: closedCount,
        timestamp: now,
      };
    } catch (error) {
      this.logger.error('Error processing job expiry', error);
      throw error;
    }
  }
}
