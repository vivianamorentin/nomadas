import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import * as moment from 'moment';

/**
 * Custom Logger Service
 * Provides structured logging with Winston
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const logFormat = process.env.LOG_FORMAT || 'json';

    this.logger = winston.createLogger({
      level: logLevel,
      format:
        logFormat === 'json'
          ? winston.format.combine(winston.format.timestamp(), winston.format.json())
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.printf(({ timestamp, level, message, context, ...metadata }) => {
                return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${
                  Object.keys(metadata).length ? JSON.stringify(metadata) : ''
                }`;
              }),
            ),
      transports: [
        new winston.transports.Console({
          silent: process.env.NODE_ENV === 'test',
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context, trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  /**
   * Set log level dynamically
   */
  setLevel(level: string) {
    this.logger.level = level;
  }

  /**
   * Log with metadata
   */
  logWithMetadata(message: string, metadata: Record<string, any>, context?: string) {
    this.logger.info(message, { context, ...metadata });
  }

  /**
   * Log error with stack trace
   */
  logError(error: Error, context?: string) {
    this.logger.error(error.message, {
      context,
      stack: error.stack,
      name: error.name,
    });
  }
}
