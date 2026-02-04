import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './cache/redis.module';
import { LoggerModule } from './logging/logger.module';
import { StorageModule } from './storage/storage.module';
import { SearchModule } from './search/opensearch.module';

/**
 * Shared Infrastructure Module
 * Provides cross-cutting concerns for all bounded contexts
 */
@Global()
@Module({
  imports: [
    // Database (Prisma)
    PrismaModule,

    // Cache (Redis)
    RedisModule,

    // Logging (Winston)
    LoggerModule,

    // Storage (S3)
    StorageModule,

    // Search (OpenSearch)
    SearchModule,
  ],
  exports: [
    PrismaModule,
    RedisModule,
    LoggerModule,
    StorageModule,
    SearchModule,
  ],
})
export class InfrastructureModule {}
