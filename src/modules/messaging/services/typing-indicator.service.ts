import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/**
 * Typing Indicator Service
 * SPEC-MSG-001 Phase 4
 * Manages typing indicators via Redis with TTL
 */
@Injectable()
export class TypingIndicatorService {
  private readonly logger = new Logger(TypingIndicatorService.name);
  private readonly redis: Redis;
  private readonly TYPING_TTL = 10; // 10 seconds
  private readonly KEY_PREFIX = 'typing:conversation:';

  constructor(private readonly configService: ConfigService) {
    // Initialize Redis client
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: this.configService.get('REDIS_PORT') || 6379,
    });

    this.redis.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
  }

  /**
   * Start typing indicator for user in conversation
   * Auto-expires after TYPING_TTL seconds
   */
  async startTyping(conversationId: string, userId: number): Promise<void> {
    const key = this.getKey(conversationId, userId);
    const value = JSON.stringify({
      userId,
      startedAt: new Date().toISOString(),
    });

    // Set with TTL (auto-expire)
    await this.redis.set(key, value, 'EX', this.TYPING_TTL);

    this.logger.debug(`User ${userId} started typing in conversation ${conversationId}`);
  }

  /**
   * Stop typing indicator for user in conversation
   */
  async stopTyping(conversationId: string, userId: number): Promise<void> {
    const key = this.getKey(conversationId, userId);
    await this.redis.del(key);

    this.logger.debug(`User ${userId} stopped typing in conversation ${conversationId}`);
  }

  /**
   * Clear all typing indicators for a user
   * Called when user disconnects or leaves conversation
   */
  async clearUserTyping(userId: number): Promise<void> {
    const pattern = `${this.KEY_PREFIX}*:${userId}`;

    // Find all keys matching pattern
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
      this.logger.debug(`Cleared ${keys.length} typing indicators for user ${userId}`);
    }
  }

  /**
   * Clear all typing indicators for a conversation
   */
  async clearConversationTyping(conversationId: string): Promise<void> {
    const pattern = `${this.KEY_PREFIX}${conversationId}:*`;

    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
      this.logger.debug(`Cleared ${keys.length} typing indicators for conversation ${conversationId}`);
    }
  }

  /**
   * Get active typing indicators for a conversation
   * Returns list of user IDs currently typing
   */
  async getActiveTypingUsers(conversationId: string): Promise<number[]> {
    const pattern = `${this.KEY_PREFIX}${conversationId}:*`;
    const keys = await this.redis.keys(pattern);

    if (keys.length === 0) {
      return [];
    }

    // Extract user IDs from keys
    const userIds = keys.map((key) => {
      const parts = key.split(':');
      return parseInt(parts[parts.length - 1]);
    });

    this.logger.debug(`Active typing users in conversation ${conversationId}: ${userIds}`);

    return userIds;
  }

  /**
   * Check if specific user is typing in conversation
   */
  async isUserTyping(conversationId: string, userId: number): Promise<boolean> {
    const key = this.getKey(conversationId, userId);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Get typing indicator data for user
   */
  async getTypingData(conversationId: string, userId: number): Promise<{ userId: number; startedAt: string } | null> {
    const key = this.getKey(conversationId, userId);
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * Extend typing indicator TTL
   * Called when user continues typing
   */
  async extendTyping(conversationId: string, userId: number): Promise<void> {
    const key = this.getKey(conversationId, userId);
    const exists = await this.redis.exists(key);

    if (exists === 1) {
      await this.redis.expire(key, this.TYPING_TTL);
      this.logger.debug(`Extended typing indicator for user ${userId} in conversation ${conversationId}`);
    }
  }

  /**
   * Get statistics about typing indicators
   */
  async getStats(): Promise<{ totalTypingIndicators: number; conversationsWithTyping: number }> {
    const pattern = `${this.KEY_PREFIX}*`;
    const keys = await this.redis.keys(pattern);

    // Count unique conversations
    const uniqueConversations = new Set<string>();
    keys.forEach((key) => {
      const parts = key.split(':');
      if (parts.length >= 3) {
        uniqueConversations.add(parts[2]);
      }
    });

    return {
      totalTypingIndicators: keys.length,
      conversationsWithTyping: uniqueConversations.size,
    };
  }

  /**
   * Generate Redis key for typing indicator
   */
  private getKey(conversationId: string, userId: number): string {
    return `${this.KEY_PREFIX}${conversationId}:${userId}`;
  }

  /**
   * Cleanup on service shutdown
   */
  async onModuleDestroy() {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }
}
