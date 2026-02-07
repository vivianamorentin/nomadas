import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TypingIndicatorService } from './typing-indicator.service';
import Redis from 'ioredis';

/**
 * TypingIndicatorService Unit Tests
 * SPEC-MSG-001 Phase 7
 */
describe('TypingIndicatorService', () => {
  let service: TypingIndicatorService;
  let redis: Redis;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'REDIS_HOST') return 'localhost';
      if (key === 'REDIS_PORT') return 6379;
      return null;
    }),
  };

  beforeAll(async () => {
    // Create real Redis connection for integration testing
    redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryStrategy: () => null, // Don't retry
      maxRetriesPerRequest: 0,
    });

    // Clear any existing data
    await redis.flushdb();
  });

  afterAll(async () => {
    await redis.flushdb();
    await redis.quit();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypingIndicatorService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TypingIndicatorService>(TypingIndicatorService);

    // Clear Redis before each test
    await redis.flushdb();
  });

  afterEach(async () => {
    // Cleanup after service is created
    await service.onModuleDestroy();
  });

  describe('startTyping', () => {
    it('should create typing indicator for user', async () => {
      const conversationId = 'conv-123';
      const userId = 1;

      await service.startTyping(conversationId, userId);

      const isTyping = await service.isUserTyping(conversationId, userId);
      expect(isTyping).toBe(true);
    });

    it('should set TTL on typing indicator', async () => {
      const conversationId = 'conv-456';
      const userId = 2;

      await service.startTyping(conversationId, userId);

      // Get TTL from Redis
      const key = `typing:conversation:${conversationId}:${userId}`;
      const ttl = await redis.ttl(key);

      // TTL should be approximately 10 seconds
      expect(ttl).toBeGreaterThan(8);
      expect(ttl).toBeLessThanOrEqual(10);
    });

    it('should allow multiple users to type in same conversation', async () => {
      const conversationId = 'conv-789';
      const user1 = 3;
      const user2 = 4;

      await service.startTyping(conversationId, user1);
      await service.startTyping(conversationId, user2);

      const activeUsers = await service.getActiveTypingUsers(conversationId);
      expect(activeUsers).toHaveLength(2);
      expect(activeUsers).toContain(user1);
      expect(activeUsers).toContain(user2);
    });
  });

  describe('stopTyping', () => {
    it('should remove typing indicator', async () => {
      const conversationId = 'conv-stop';
      const userId = 5;

      await service.startTyping(conversationId, userId);
      await service.stopTyping(conversationId, userId);

      const isTyping = await service.isUserTyping(conversationId, userId);
      expect(isTyping).toBe(false);
    });

    it('should handle stopping non-existent typing indicator', async () => {
      const conversationId = 'conv-stop-none';
      const userId = 6;

      // Should not throw error
      await expect(service.stopTyping(conversationId, userId)).resolves.toBeUndefined();
    });
  });

  describe('getActiveTypingUsers', () => {
    it('should return empty array for conversation with no typing users', async () => {
      const conversationId = 'conv-empty';

      const activeUsers = await service.getActiveTypingUsers(conversationId);
      expect(activeUsers).toEqual([]);
    });

    it('should return only active typing users', async () => {
      const conversationId = 'conv-mixed';
      const user1 = 7;
      const user2 = 8;

      await service.startTyping(conversationId, user1);
      await service.startTyping(conversationId, user2);
      await service.stopTyping(conversationId, user1);

      const activeUsers = await service.getActiveTypingUsers(conversationId);
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0]).toBe(user2);
    });
  });

  describe('clearUserTyping', () => {
    it('should remove all typing indicators for user across conversations', async () => {
      const conv1 = 'conv-clear-1';
      const conv2 = 'conv-clear-2';
      const userId = 9;

      await service.startTyping(conv1, userId);
      await service.startTyping(conv2, userId);

      await service.clearUserTyping(userId);

      const typingInConv1 = await service.isUserTyping(conv1, userId);
      const typingInConv2 = await service.isUserTyping(conv2, userId);

      expect(typingInConv1).toBe(false);
      expect(typingInConv2).toBe(false);
    });
  });

  describe('extendTyping', () => {
    it('should extend TTL for active typing indicator', async () => {
      const conversationId = 'conv-extend';
      const userId = 10;

      await service.startTyping(conversationId, userId);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Extend TTL
      await service.extendTyping(conversationId, userId);

      // Check that user is still typing
      const isTyping = await service.isUserTyping(conversationId, userId);
      expect(isTyping).toBe(true);
    });

    it('should not create new typing indicator if not exists', async () => {
      const conversationId = 'conv-extend-none';
      const userId = 11;

      // Extend without starting
      await service.extendTyping(conversationId, userId);

      const isTyping = await service.isUserTyping(conversationId, userId);
      expect(isTyping).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      const conv1 = 'conv-stats-1';
      const conv2 = 'conv-stats-2';
      const user1 = 12;
      const user2 = 13;

      await service.startTyping(conv1, user1);
      await service.startTyping(conv2, user2);

      const stats = await service.getStats();

      expect(stats.totalTypingIndicators).toBe(2);
      expect(stats.conversationsWithTyping).toBe(2);
    });
  });
});
