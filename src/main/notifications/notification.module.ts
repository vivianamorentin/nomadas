import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationController } from './notification.controller';
import { TemplateController } from './template.controller';
import { DeviceTokenController } from './device-token.controller';
import { NotificationService } from './services/notification.service';
import { NotificationPreferenceService } from './services/notification-preference.service';
import { TemplateEngineService } from './services/template-engine.service';
import { EmailService } from './services/email.service';
import { PushService } from './services/push.service';
import { DeviceTokenService } from './services/device-token.service';
import { NotificationGateway } from './gateways/notification.gateway';
import { NotificationQueuesModule } from './queues/notification-queues.module';
import { PrismaService } from '../../shared/infrastructure/database/prisma.service';

/**
 * Notification Module
 * Multi-channel notification system
 * SPEC-NOT-001
 */
@Module({
  imports: [ConfigModule, JwtModule, NotificationQueuesModule],
  controllers: [NotificationController, TemplateController, DeviceTokenController],
  providers: [
    PrismaService,
    NotificationService,
    NotificationPreferenceService,
    TemplateEngineService,
    EmailService,
    PushService,
    DeviceTokenService,
    NotificationGateway,
  ],
  exports: [
    NotificationService,
    NotificationPreferenceService,
    TemplateEngineService,
    PushService,
    DeviceTokenService,
  ],
})
export class NotificationModule {}
