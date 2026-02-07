import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailNotificationProcessor } from './email-notification.processor';
import { PushNotificationProcessor } from './push-notification.processor';
import { PrismaService } from '../../shared/infrastructure/database/prisma.service';
import { TemplateEngineService } from '../services/template-engine.service';
import { EmailService } from '../services/email.service';
import { PushService } from '../services/push.service';
import { DeviceTokenService } from '../services/device-token.service';

/**
 * Notification Queues Module
 * Bull queues for notification delivery
 * SPEC-NOT-001 Phase 3
 */
@Module({
  imports: [
    BullModule.registerQueueAsync(
      {
        name: 'email-notifications',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          redis: {
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: configService.get<number>('REDIS_PORT') || 6379,
            password: configService.get<string>('REDIS_PASSWORD'),
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            removeOnComplete: 20,
            removeOnFail: 50,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'push-notifications',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          redis: {
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: configService.get<number>('REDIS_PORT') || 6379,
            password: configService.get<string>('REDIS_PASSWORD'),
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 3000,
            },
            removeOnComplete: 30,
            removeOnFail: 100,
          },
        }),
        inject: [ConfigService],
      }
    ),
  ],
  providers: [
    PrismaService,
    TemplateEngineService,
    EmailService,
    PushService,
    DeviceTokenService,
    EmailNotificationProcessor,
    PushNotificationProcessor,
  ],
  exports: [BullModule],
})
export class NotificationQueuesModule {}
