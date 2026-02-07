import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Auto-Archive Service
 * SPEC-MSG-001 Phase 6
 * Bull queue processor for auto-archiving conversations
 * NFR-MSG-COMP-001: Auto-archive after 90 days
 */
@Injectable()
export class AutoArchiveService {
  private readonly logger = new Logger(AutoArchiveService.name);
  private readonly ARCHIVE_AFTER_DAYS = 90; // 90 days of inactivity

  constructor(
    @InjectQueue('archive-queue') private readonly archiveQueue: Queue,
    private readonly prisma: PrismaService,
  ) {
    this.registerProcessors();
  }

  /**
   * Register Bull queue processors
   */
  private registerProcessors() {
    // Archive conversations processor
    this.archiveQueue.process('archive-conversations', async (job) => {
      return this.archiveInactiveConversations(job.data);
    });

    this.logger.log('Bull queue processors registered');
  }

  /**
   * Scheduled task: Run daily at 2:00 AM
   * Enqueues job to archive inactive conversations
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduleArchiveJob() {
    try {
      await this.archiveQueue.add('archive-conversations', {
        timestamp: new Date().toISOString(),
      });

      this.logger.log('Scheduled archive job enqueued');
    } catch (error) {
      this.logger.error(`Failed to schedule archive job: ${error.message}`);
    }
  }

  /**
   * Archive conversations with no activity > 90 days
   */
  private async archiveInactiveConversations(data: any): Promise<{ archived: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.ARCHIVE_AFTER_DAYS);

      this.logger.log(`Archiving conversations inactive since ${cutoffDate.toISOString()}`);

      // Find conversations to archive
      const conversationsToArchive = await this.prisma.conversation.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { lastMessageAt: null, createdAt: { lt: cutoffDate } },
            { lastMessageAt: { lt: cutoffDate } },
          ],
        },
        select: {
          id: true,
          user1Id: true,
          user2Id: true,
          lastMessageAt: true,
        },
      });

      this.logger.log(`Found ${conversationsToArchive.length} conversations to archive`);

      // Archive in batches
      const BATCH_SIZE = 100;
      let archivedCount = 0;

      for (let i = 0; i < conversationsToArchive.length; i += BATCH_SIZE) {
        const batch = conversationsToArchive.slice(i, i + BATCH_SIZE);
        const ids = batch.map((c) => c.id);

        await this.prisma.conversation.updateMany({
          where: { id: { in: ids } },
          data: {
            status: 'AUTO_ARCHIVED',
            archivedAt: new Date(),
          },
        });

        archivedCount += batch.length;
        this.logger.debug(`Archived batch ${i / BATCH_SIZE + 1}: ${batch.length} conversations`);
      }

      this.logger.log(`Archive job completed: ${archivedCount} conversations archived`);

      return { archived: archivedCount };
    } catch (error) {
      this.logger.error(`Archive job failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Manual archive trigger for testing
   */
  async triggerArchive(): Promise<{ archived: number }> {
    const job = await this.archiveQueue.add('archive-conversations', {
      timestamp: new Date().toISOString(),
      manual: true,
    });

    const result = await job.finished();

    return result;
  }

  /**
   * Get archive statistics
   */
  async getArchiveStats(): Promise<{
    active: number;
    archived: number;
    autoArchived: number;
    eligibleForArchive: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.ARCHIVE_AFTER_DAYS);

    const [active, archived, autoArchived, eligible] = await Promise.all([
      this.prisma.conversation.count({ where: { status: 'ACTIVE' } }),
      this.prisma.conversation.count({ where: { status: 'ARCHIVED' } }),
      this.prisma.conversation.count({ where: { status: 'AUTO_ARCHIVED' } }),
      this.prisma.conversation.count({
        where: {
          status: 'ACTIVE',
          OR: [
            { lastMessageAt: null, createdAt: { lt: cutoffDate } },
            { lastMessageAt: { lt: cutoffDate } },
          ],
        },
      }),
    ]);

    return {
      active,
      archived,
      autoArchived,
      eligibleForArchive: eligible,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.archiveQueue.getWaitingCount(),
      this.archiveQueue.getActiveCount(),
      this.archiveQueue.getCompletedCount(),
      this.archiveQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }
}
