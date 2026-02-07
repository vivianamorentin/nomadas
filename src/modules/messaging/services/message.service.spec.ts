import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessageService } from './message.service';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { MessageSearchService } from './message-search.service';
import { PresenceService } from './services/presence.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { MessageType } from '@prisma/client';

/**
 * MessageService Unit Tests
 * SPEC-MSG-001 Phase 7
 */
describe('MessageService', () => {
  let service: MessageService;
  let prisma: PrismaService;

  const mockPrisma = {
    conversation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    messageNew: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockMessageSearchService = {
    updateSearchText: jest.fn(),
    searchMessages: jest.fn(),
    searchAllConversations: jest.fn(),
    getSearchStats: jest.fn(),
  };

  const mockPresenceService = {
    setOnline: jest.fn(),
    setAway: jest.fn(),
    setOffline: jest.fn(),
    getUserPresence: jest.fn(),
    getBulkPresence: jest.fn(),
    updateHeartbeat: jest.fn(),
    getOnlineCount: jest.fn(),
    getOnlineUsers: jest.fn(),
    getStats: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  const mockNotificationsService = {
    findByUserId: jest.fn(),
    updatePreferences: jest.fn(),
    sendPushNotification: jest.fn(),
    sendEmailNotification: jest.fn(),
    notifyNewApplication: jest.fn(),
    notifyApplicationStatusChanged: jest.fn(),
    notifyNewMessage: jest.fn(),
    notifyNewReview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: MessageSearchService,
          useValue: mockMessageSearchService,
        },
        {
          provide: PresenceService,
          useValue: mockPresenceService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send text message successfully', async () => {
      const conversationId = 'conv-123';
      const senderId = 1;
      const dto = {
        messageType: 'TEXT',
        content: 'Hello, world!',
      };

      const mockConversation = {
        id: conversationId,
        user1Id: 1,
        user2Id: 2,
      };

      const mockMessage = {
        id: 'msg-123',
        conversationId,
        senderId,
        messageType: 'TEXT',
        content: 'Hello, world!',
        createdAt: new Date(),
        sender: {
          id: senderId,
          email: 'test@example.com',
          workerProfile: {
            firstName: 'John',
            lastName: 'Doe',
            profilePhoto: null,
          },
          businessProfiles: [],
        },
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.messageNew.create.mockResolvedValue(mockMessage);
      mockPrisma.conversation.update.mockResolvedValue({});
      mockPresenceService.getUserPresence.mockResolvedValue(null);
      mockNotificationsService.findByUserId.mockResolvedValue({ enablePush: true });

      const result = await service.sendMessage(conversationId, senderId, dto);

      expect(result).toEqual(mockMessage);
      expect(mockPrisma.messageNew.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          conversationId,
          senderId,
          messageType: 'TEXT',
          content: 'Hello, world!',
        }),
        include: expect.any(Object),
      });
      expect(mockMessageSearchService.updateSearchText).toHaveBeenCalledWith(mockMessage.id);
    });

    it('should sanitize HTML in message content', async () => {
      const conversationId = 'conv-sanitize';
      const senderId = 1;
      const dto = {
        messageType: 'TEXT',
        content: '<script>alert("xss")</script>Hello',
      };

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: conversationId,
        user1Id: 1,
        user2Id: 2,
      });

      mockPrisma.messageNew.create.mockResolvedValue({
        id: 'msg-sanitize',
        conversationId,
        senderId,
        messageType: 'TEXT',
        content: 'Hello', // Script tag should be removed
        createdAt: new Date(),
        sender: {
          id: senderId,
          email: 'test@example.com',
          workerProfile: { firstName: 'John', lastName: 'Doe', profilePhoto: null },
          businessProfiles: [],
        },
      });

      mockPrisma.conversation.update.mockResolvedValue({});
      mockPresenceService.getUserPresence.mockResolvedValue(null);
      mockNotificationsService.findByUserId.mockResolvedValue({ enablePush: true });

      await service.sendMessage(conversationId, senderId, dto);

      expect(mockPrisma.messageNew.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          content: 'Hello',
        }),
        include: expect.any(Object),
      });
    });

    it('should throw ForbiddenException if user is not participant', async () => {
      const conversationId = 'conv-forbidden';
      const senderId = 3;
      const dto = {
        messageType: 'TEXT',
        content: 'Hello',
      };

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: conversationId,
        user1Id: 1,
        user2Id: 2,
      });

      await expect(service.sendMessage(conversationId, senderId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if conversation not found', async () => {
      const conversationId = 'conv-not-found';
      const senderId = 1;
      const dto = {
        messageType: 'TEXT',
        content: 'Hello',
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(null);

      await expect(service.sendMessage(conversationId, senderId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark specific message as read', async () => {
      const conversationId = 'conv-read';
      const userId = 2;
      const dto = {
        messageId: 'msg-read',
        markAll: false,
      };

      const mockMessage = {
        id: 'msg-read',
        conversationId,
        senderId: 1,
        readAt: null,
      };

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: conversationId,
        user1Id: 1,
        user2Id: 2,
      });

      mockPrisma.messageNew.findUnique.mockResolvedValue(mockMessage);
      mockPrisma.messageNew.update.mockResolvedValue({
        ...mockMessage,
        readAt: new Date(),
      });

      await service.markAsRead(conversationId, userId, dto);

      expect(mockPrisma.messageNew.update).toHaveBeenCalledWith({
        where: { id: 'msg-read' },
        data: { readAt: expect.any(Date) },
      });
    });

    it('should mark all messages as read', async () => {
      const conversationId = 'conv-read-all';
      const userId = 2;
      const dto = {
        markAll: true,
      };

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: conversationId,
        user1Id: 1,
        user2Id: 2,
      });

      mockPrisma.messageNew.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAsRead(conversationId, userId, dto);

      expect(result).toEqual({ count: 5 });
      expect(mockPrisma.messageNew.updateMany).toHaveBeenCalledWith({
        where: {
          conversationId,
          senderId: { not: 2 },
          readAt: null,
        },
        data: { readAt: expect.any(Date) },
      });
    });

    it('should throw error if trying to mark own message as read', async () => {
      const conversationId = 'conv-own';
      const userId = 1;
      const dto = {
        messageId: 'msg-own',
        markAll: false,
      };

      const mockMessage = {
        id: 'msg-own',
        conversationId,
        senderId: 1, // Same as userId
      };

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: conversationId,
        user1Id: 1,
        user2Id: 2,
      });

      mockPrisma.messageNew.findUnique.mockResolvedValue(mockMessage);

      await expect(service.markAsRead(conversationId, userId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('validateMessageContent', () => {
    it('should accept valid text message', () => {
      const result = service.validateMessageContent('Hello, world!', 'TEXT' as MessageType);
      expect(result.valid).toBe(true);
    });

    it('should reject empty text message', () => {
      const result = service.validateMessageContent('', 'TEXT' as MessageType);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text message cannot be empty');
    });

    it('should reject message too long', () => {
      const longContent = 'a'.repeat(5001);
      const result = service.validateMessageContent(longContent, 'TEXT' as MessageType);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message too long (max 5000 characters)');
    });

    it('should accept image message without caption', () => {
      const result = service.validateMessageContent(null, 'IMAGE' as MessageType);
      expect(result.valid).toBe(true);
    });

    it('should accept image message with short caption', () => {
      const result = service.validateMessageContent('Nice photo!', 'IMAGE' as MessageType);
      expect(result.valid).toBe(true);
    });

    it('should reject image caption too long', () => {
      const longCaption = 'a'.repeat(501);
      const result = service.validateMessageContent(longCaption, 'IMAGE' as MessageType);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Image caption too long (max 500 characters)');
    });
  });
});
