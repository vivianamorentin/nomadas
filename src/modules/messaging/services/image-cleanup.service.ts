import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { StorageService } from 'src/shared/infrastructure/storage/storage.service';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Image Cleanup Service
 * SPEC-MSG-001 Phase 6
 * Bull queue processor for GDPR-compliant image cleanup
 * NFR-MSG-SEC-006: Auto-delete images after 90 days
 */
@Injectable()
export class ImageCleanupService {
  private readonly logger = new Logger(ImageCleanupService.name);
  private readonly CLEANUP_AFTER_DAYS = 90; // 90 days per GDPR

  constructor(
    @InjectQueue('image-cleanup-queue') private readonly imageCleanupQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {
    this.registerProcessors();
  }

  /**
   * Register Bull queue processors
   */
  private registerProcessors() {
    // Cleanup old images processor
    this.imageCleanupQueue.process('cleanup-old-images', async (job) => {
      return this.cleanupOldImages(job.data);
    });

    this.logger.log('Bull queue processors registered');
  }

  /**
   * Scheduled task: Run daily at 3:00 AM (after archive job)
   * Enqueues job to delete old images
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduleCleanupJob() {
    try {
      await this.imageCleanupQueue.add('cleanup-old-images', {
        timestamp: new Date().toISOString(),
      });

      this.logger.log('Scheduled image cleanup job enqueued');
    } catch (error) {
      this.logger.error(`Failed to schedule cleanup job: ${error.message}`);
    }
  }

  /**
   * Delete MessageImage records older than 90 days
   * and remove actual files from S3
   */
  private async cleanupOldImages(data: any): Promise<{
    deletedFromDatabase: number;
    deletedFromS3: number;
    errors: number;
  }> {
    try {
      const now = new Date();

      this.logger.log(`Starting image cleanup job at ${now.toISOString()}`);

      // Find images past their deletion date
      const imagesToDelete = await this.prisma.messageImage.findMany({
        where: {
          deleteAfter: {
            lt: now,
          },
        },
        select: {
          id: true,
          storageKey: true,
          messageId: true,
          originalFilename: true,
        },
      });

      this.logger.log(`Found ${imagesToDelete.length} images to delete`);

      let deletedFromDatabase = 0;
      let deletedFromS3 = 0;
      let errors = 0;

      // Process in batches
      const BATCH_SIZE = 50;

      for (let i = 0; i < imagesToDelete.length; i += BATCH_SIZE) {
        const batch = imagesToDelete.slice(i, i + BATCH_SIZE);

        for (const image of batch) {
          try {
            // Delete from S3
            await this.storageService.deleteFile(image.storageKey, 'photos');
            deletedFromS3++;

            this.logger.debug(`Deleted S3 file: ${image.storageKey}`);
          } catch (s3Error) {
            this.logger.warn(`Failed to delete S3 file ${image.storageKey}: ${s3Error.message}`);
            errors++;
          }

          try {
            // Delete from database
            await this.prisma.messageImage.delete({
              where: { id: image.id },
            });
            deletedFromDatabase++;

            this.logger.debug(`Deleted database record: ${image.id}`);
          } catch (dbError) {
            this.logger.warn(`Failed to delete database record ${image.id}: ${dbError.message}`);
            errors++;
          }
        }

        this.logger.debug(`Processed batch ${i / BATCH_SIZE + 1}`);
      }

      this.logger.log(
        `Cleanup job completed: ${deletedFromDatabase} DB records, ${deletedFromS3} S3 files deleted, ${errors} errors`,
      );

      return {
        deletedFromDatabase,
        deletedFromS3,
        errors,
      };
    } catch (error) {
      this.logger.error(`Cleanup job failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Manual cleanup trigger for testing
   */
  async triggerCleanup(): Promise<{
    deletedFromDatabase: number;
    deletedFromS3: number;
    errors: number;
  }> {
    const job = await this.imageCleanupQueue.add('cleanup-old-images', {
      timestamp: new Date().toISOString(),
      manual: true,
    });

    const result = await job.finished();

    return result;
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    totalImages: number;
    pendingDeletion: number;
    overdueForDeletion: number;
    deletedThisMonth: number;
  }> {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const [totalImages, pendingDeletion, overdueForDeletion, deletedThisMonth] = await Promise.all([
      this.prisma.messageImage.count(),
      this.prisma.messageImage.count({
        where: {
          deleteAfter: { gt: now },
        },
      }),
      this.prisma.messageImage.count({
        where: {
          deleteAfter: { lt: now },
        },
      }),
      this.prisma.messageImage.count({
        where: {
          createdAt: { gte: monthAgo },
        },
      }),
    ]);

    return {
      totalImages,
      pendingDeletion,
      overdueForDeletion,
      deletedThisMonth,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.imageCleanupQueue.getWaitingCount(),
      this.imageCleanupQueue.getActiveCount(),
      this.imageCleanupQueue.getCompletedCount(),
      this.imageCleanupQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }

  /**
   * Mark image for immediate deletion (GDPR right to erasure)
   */
  async markForImmediateDeletion(imageId: string): Promise<void> {
    const image = await this.prisma.messageImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Set deleteAfter to now
    await this.prisma.messageImage.update({
      where: { id: imageId },
      data: { deleteAfter: new Date() },
    });

    this.logger.log(`Image ${imageId} marked for immediate deletion`);
  }
}
