import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';

// Enhanced Messaging System (SPEC-MSG-001)
import { ConversationController } from './controllers/conversation.controller';
import { MessageController, MessageReadController } from './controllers/message.controller';
import { MessageGateway } from './gateways/message.gateway';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { ImageUploadService } from './services/image-upload.service';
// Phase 4: Advanced Features
import { TypingIndicatorService } from './services/typing-indicator.service';
import { PresenceService } from './services/presence.service';
import { MessageSearchService } from './services/message-search.service';
// Phase 6: Automation
import { AutoArchiveService } from './services/auto-archive.service';
import { ImageCleanupService } from './services/image-cleanup.service';
import { MessagingQueuesModule } from './queues/messaging-queues.module';

// Shared Infrastructure
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { StorageService } from 'src/shared/infrastructure/storage/storage.service';
// Phase 5: Push Notifications
import { NotificationsService } from 'src/modules/notifications/notifications.service';

/**
 * Messaging Context
 * Handles real-time messaging with enhanced features
 * SPEC-MSG-001 Phases 1-6
 */
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),
    ScheduleModule.forRoot(), // For cron jobs (Phase 6)
    MessagingQueuesModule, // Bull queues (Phase 6)
  ],
  controllers: [
    MessagingController, // Legacy
    ConversationController,
    MessageController,
    MessageReadController,
  ],
  providers: [
    MessagingService, // Legacy
    MessagingGateway, // Legacy
    PrismaService,
    StorageService,
    // Enhanced Messaging Services & Gateways
    MessageGateway,
    ConversationService,
    MessageService,
    ImageUploadService,
    // Phase 4: Advanced Features
    TypingIndicatorService,
    PresenceService,
    MessageSearchService,
    // Phase 5: Push Notifications
    NotificationsService,
    // Phase 6: Automation
    AutoArchiveService,
    ImageCleanupService,
  ],
  exports: [
    MessagingService,
    MessageGateway,
    ConversationService,
    MessageService,
    ImageUploadService,
    TypingIndicatorService,
    PresenceService,
    MessageSearchService,
    AutoArchiveService,
    ImageCleanupService,
  ],
})
export class MessagingModule {}
