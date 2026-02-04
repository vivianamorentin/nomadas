import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

/**
 * Redis Cache Module
 * Provides Redis caching service globally
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {
  constructor(private readonly configService: ConfigService) {
    // Redis URL is validated in the service
  }
}
