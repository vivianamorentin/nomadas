import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

/**
 * Redis Service - Cache Management
 * Handles caching, rate limiting, and session storage
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);
  private readonly defaultTTL = 3600; // 1 hour

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.client = createClient({
        url: this.configService.get<string>('REDIS_URL'),
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              this.logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection failed');
            }
            return retries * 100; // Exponential backoff
          },
        },
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error', err);
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.disconnect();
    this.logger.log('Redis disconnected');
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Error getting key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting key: ${key}`, error);
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key: ${key}`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking key: ${key}`, error);
      return false;
    }
  }

  /**
   * Increment counter (for rate limiting)
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key: ${key}`, error);
      return 0;
    }
  }

  /**
   * Set expiration on key
   */
  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Error setting expiration on key: ${key}`, error);
    }
  }

  /**
   * Get remaining TTL
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key: ${key}`, error);
      return -1;
    }
  }

  /**
   * Set multiple values (pipeline)
   */
  async mset(keyValuePairs: Record<string, string>): Promise<void> {
    try {
      const pipeline = this.client.multi();
      for (const [key, value] of Object.entries(keyValuePairs)) {
        pipeline.set(key, value);
      }
      await pipeline.exec();
    } catch (error) {
      this.logger.error('Error in mset', error);
    }
  }

  /**
   * Get multiple values
   */
  async mget(keys: string[]): Promise<string[]> {
    try {
      return await this.client.mGet(keys);
    } catch (error) {
      this.logger.error('Error in mget', error);
      return [];
    }
  }

  /**
   * Clear all keys (use with caution)
   */
  async flushDb(): Promise<void> {
    try {
      await this.client.flushDb();
      this.logger.warn('Redis database flushed');
    } catch (error) {
      this.logger.error('Error flushing database', error);
    }
  }

  /**
   * Publish message to channel (for WebSocket pub/sub)
   */
  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.client.publish(channel, message);
    } catch (error) {
      this.logger.error(`Error publishing to channel: ${channel}`, error);
    }
  }

  /**
   * Subscribe to channel (for WebSocket pub/sub)
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      const subscriber = this.client.duplicate();
      await subscriber.connect();
      await subscriber.subscribe(channel, (message) => {
        callback(message);
      });
    } catch (error) {
      this.logger.error(`Error subscribing to channel: ${channel}`, error);
    }
  }
}
