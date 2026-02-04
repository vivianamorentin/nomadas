import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { InfrastructureModule } from './shared/infrastructure/infrastructure.module';

// Bounded Context Modules
import { IdentityModule } from './modules/identity/identity.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ComplianceModule } from './modules/compliance/compliance.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),

    // Shared Infrastructure
    InfrastructureModule,

    // Bounded Contexts (8 modules)
    IdentityModule, // 1. Identity & Access Context
    ProfilesModule, // 2. Profile Management Context
    JobsModule, // 3. Job Marketplace Context
    ApplicationsModule, // 4. Application Workflow Context
    MessagingModule, // 5. Messaging Context
    ReviewsModule, // 6. Reputation Context
    NotificationsModule, // 7. Notification Context
    ComplianceModule, // 8. Compliance Context
  ],
})
export class AppModule {
  static port: number;

  constructor(private readonly configService: ConfigService) {
    AppModule.port = this.configService.get<number>('PORT') || 3000;
  }
}
