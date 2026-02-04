import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Logger Module
 * Provides structured logging service globally
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
