import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/**
 * Presence Status Enum
 */
export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  OFFLINE = 'offline',
}

/**
 * Presence Data Interface
 */
interface PresenceData {
  userId: number;
  status: PresenceStatus;
  lastSeen: string; // ISO timestamp
  clientCount: number; // Number of active connections
}

/**
 * Presence Service
 * SPEC-MSG-001 Phase 4
 * Manages user presence with heartbeat mechanism
 */
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private readonly redis: Redis;
  private readonly ONLINE_TTL = 120; // 2 minutes
  private readonly AWAY_TTL = 300; // 5 minutes
  private readonly HEARTBEAT_INTERVAL = 60; // 1 minute
  private readonly KEY_PREFIX = 'presence:user:';

  constructor(private readonly configService: ConfigService) {
    // Initialize Redis client
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: this.configService.get('REDIS_PORT') || 6379,
    });

    this.redis.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    // Start heartbeat cleanup job
    this.startHeartbeatCleanup();
  }

  /**
   * Set user status to ONLINE
   * Called when user connects
   */
  async setOnline(userId: number, clientCount = 1): Promise<PresenceData> {
    const key = this.getKey(userId);
    const presenceData: PresenceData = {
      userId,
      status: PresenceStatus.ONLINE,
      lastSeen: new Date().toISOString(),
      clientCount,
    };

    // Store in Redis with TTL
    await this.redis.set(key, JSON.stringify(presenceData), 'EX', this.ONLINE_TTL);

    this.logger.debug(`User ${userId} is now ONLINE (${clientCount} connections)`);

    return presenceData;
  }

  /**
   * Set user status to AWAY
   * Called when user is inactive
   */
  async setAway(userId: number): Promise<PresenceData> {
    const key = this.getKey(userId);

    // Get existing data to preserve clientCount
    const existing = await this.getUserPresence(userId);
    const clientCount = existing?.clientCount || 0;

    const presenceData: PresenceData = {
      userId,
      status: PresenceStatus.AWAY,
      lastSeen: new Date().toISOString(),
      clientCount,
    };

    // Store in Redis with longer TTL
    await this.redis.set(key, JSON.stringify(presenceData), 'EX', this.AWAY_TTL);

    this.logger.debug(`User ${userId} is now AWAY`);

    return presenceData;
  }

  /**
   * Set user status to OFFLINE
   * Called when user disconnects
   */
  async setOffline(userId: number): Promise<void> {
    const key = this.getKey(userId);

    // Get existing presence data
    const existing = await this.getUserPresence(userId);

    if (!existing) {
      return;
    }

    // Decrease client count
    const newClientCount = Math.max(0, existing.clientCount - 1);

    if (newClientCount === 0) {
      // No more connections - remove from Redis
      await this.redis.del(key);
      this.logger.debug(`User ${userId} is now OFFLINE (0 connections)`);
    } else {
      // Still has other connections - keep ONLINE but update count
      const presenceData: PresenceData = {
        userId,
        status: PresenceStatus.ONLINE,
        lastSeen: new Date().toISOString(),
        clientCount: newClientCount,
      };

      await this.redis.set(key, JSON.stringify(presenceData), 'EX', this.ONLINE_TTL);
      this.logger.debug(`User ${userId} disconnected (${newClientCount} connections remaining)`);
    }
  }

  /**
   * Get user presence status
   */
  async getUserPresence(userId: number): Promise<PresenceData | null> {
    const key = this.getKey(userId);
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * Get bulk presence status for multiple users
   * Optimized for batch queries
   */
  async getBulkPresence(userIds: number[]): Promise<Map<number, PresenceData>> {
    const presenceMap = new Map<number, PresenceData>();

    if (userIds.length === 0) {
      return presenceMap;
    }

    // Pipeline multiple Redis GET commands
    const pipeline = this.redis.pipeline();
    userIds.forEach((userId) => {
      pipeline.get(this.getKey(userId));
    });

    const results = await pipeline.exec();

    if (results) {
      for (let i = 0; i < results.length; i++) {
        const [err, data] = results[i];
        if (!err && data) {
          const presenceData: PresenceData = JSON.parse(data as string);
          presenceMap.set(userIds[i], presenceData);
        }
      }
    }

    this.logger.debug(`Retrieved presence for ${presenceMap.size}/${userIds.length} users`);

    return presenceMap;
  }

  /**
   * Update heartbeat for user
   * Extends ONLINE TTL
   */
  async updateHeartbeat(userId: number): Promise<void> {
    const key = this.getKey(userId);
    const exists = await this.redis.exists(key);

    if (exists === 1) {
      // Extend TTL
      await this.redis.expire(key, this.ONLINE_TTL);

      // Update lastSeen timestamp
      const existing = await this.getUserPresence(userId);
      if (existing) {
        const presenceData: PresenceData = {
          ...existing,
          lastSeen: new Date().toISOString(),
        };
        await this.redis.set(key, JSON.stringify(presenceData), 'EX', this.ONLINE_TTL);
      }

      this.logger.debug(`Heartbeat updated for user ${userId}`);
    }
  }

  /**
   * Get online users count
   */
  async getOnlineCount(): Promise<number> {
    const pattern = `${this.KEY_PREFIX}*`;
    const keys = await this.redis.keys(pattern);

    let onlineCount = 0;

    // Check each user's status
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const presenceData: PresenceData = JSON.parse(data);
        if (presenceData.status === PresenceStatus.ONLINE) {
          onlineCount++;
        }
      }
    }

    return onlineCount;
  }

  /**
   * Get all online user IDs
   */
  async getOnlineUsers(): Promise<number[]> {
    const pattern = `${this.KEY_PREFIX}*`;
    const keys = await this.redis.keys(pattern);

    const onlineUserIds: number[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const presenceData: PresenceData = JSON.parse(data);
        if (presenceData.status === PresenceStatus.ONLINE) {
          onlineUserIds.push(presenceData.userId);
        }
      }
    }

    return onlineUserIds;
  }

  /**
   * Get presence statistics
   */
  async getStats(): Promise<{ online: number; away: number; total: number }> {
    const pattern = `${this.KEY_PREFIX}*`;
    const keys = await this.redis.keys(pattern);

    let online = 0;
    let away = 0;

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const presenceData: PresenceData = JSON.parse(data);
        if (presenceData.status === PresenceStatus.ONLINE) {
          online++;
        } else if (presenceData.status === PresenceStatus.AWAY) {
          away++;
        }
      }
    }

    return {
      online,
      away,
      total: keys.length,
    };
  }

  /**
   * Heartbeat cleanup job
   * Runs periodically to clean up stale presence data
   * (Redis TTL handles most cleanup, but this is a safety net)
   */
  private startHeartbeatCleanup() {
    setInterval(async () => {
      try {
        const stats = await this.getStats();
        this.logger.debug(`Heartbeat cleanup: ${stats.online} online, ${stats.away} away, ${stats.total} total`);
      } catch (error) {
        this.logger.error(`Heartbeat cleanup error: ${error.message}`);
      }
    }, this.HEARTBEAT_INTERVAL * 1000);
  }

  /**
   * Generate Redis key for user presence
   */
  private getKey(userId: number): string {
    return `${this.KEY_PREFIX}${userId}`;
  }

  /**
   * Cleanup on service shutdown
   */
  async onModuleDestroy() {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }
}
