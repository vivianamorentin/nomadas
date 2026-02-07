import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

/**
 * Messaging Queues Module
 * SPEC-MSG-001 Phase 6
 * Bull queues for automation tasks
 */
@Module({
  imports: [
    // Archive queue for auto-archiving conversations
    BullModule.registerQueueAsync({
      name: 'archive-queue',
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
      inject: [ConfigService],
    }),

    // Image cleanup queue for GDPR compliance
    BullModule.registerQueueAsync({
      name: 'image-cleanup-queue',
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
        },
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 10000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class MessagingQueuesModule {}
