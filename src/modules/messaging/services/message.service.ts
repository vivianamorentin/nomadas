import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { MessageType } from '@prisma/client';
import { SendMessageDto } from '../dto/send-message.dto';
import { QueryMessagesDto } from '../dto/query-messages.dto';
import { MarkReadDto } from '../dto/mark-read.dto';
import { MessageSearchService } from './message-search.service';
import { PresenceService } from './presence.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance for server-side sanitization
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Message Service
 * SPEC-MSG-001 Phase 2
 * Handles message operations with read receipts
 */
@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messageSearchService: MessageSearchService,
    private readonly presenceService: PresenceService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Send a message to a conversation
   * REQ-MSG-001: Real-time messaging
   * REQ-MSG-003: Text and emoji support
   * REQ-MSG-004: Image sharing
   */
  async sendMessage(conversationId: string, senderId: number, dto: SendMessageDto) {
    // Verify conversation exists and user is participant
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Sanitize content if TEXT message
    let sanitizedContent = dto.content;
    if (dto.messageType === 'TEXT' && dto.content) {
      sanitizedContent = this.sanitizeMessageContent(dto.content);
    }

    // Create message
    const message = await this.prisma.messageNew.create({
      data: {
        conversationId,
        senderId,
        messageType: dto.messageType as MessageType,
        content: sanitizedContent,
        imageUrl: dto.imageUrl,
        metadata: dto.metadata,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            workerProfile: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true,
              },
            },
            businessProfiles: {
              select: {
                businessName: true,
              },
            },
          },
        },
      },
    });

    // Update conversation's lastMessageAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Update full-text search vector
    await this.messageSearchService.updateSearchText(message.id);

    // Send push notification if recipient is offline (Phase 5)
    await this.sendPushNotificationIfNeeded(conversation, senderId, message);

    this.logger.log(`Message sent: ${message.id} in conversation ${conversationId} by user ${senderId}`);

    return message;
  }

  /**
   * Get messages from a conversation with cursor-based pagination
   * NFR-MSG-SCAL-004: Pagination for 50+ messages
   */
  async findMessages(conversationId: string, userId: number, query: QueryMessagesDto) {
    // Verify conversation access
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    const { cursor, limit = 50 } = query;

    const messages = await this.prisma.messageNew.findMany({
      where: {
        conversationId,
        isArchived: false,
        ...(cursor && {
          createdAt: {
            lt: cursor, // Fetch messages older than cursor
          },
        }),
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            workerProfile: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true,
              },
            },
            businessProfiles: {
              select: {
                businessName: true,
              },
            },
          },
        },
        images: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Reverse to show oldest first
    const reversedMessages = messages.reverse();

    // Get next cursor
    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    return {
      data: reversedMessages,
      meta: {
        nextCursor,
        hasMore: messages.length === limit,
      },
    };
  }

  /**
   * Mark message(s) as read
   * REQ-MSG-005: Read receipts
   */
  async markAsRead(conversationId: string, userId: number, dto: MarkReadDto) {
    // Verify conversation access
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    // Mark specific message as read
    if (dto.messageId && !dto.markAll) {
      const message = await this.prisma.messageNew.findUnique({
        where: { id: dto.messageId },
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      if (message.conversationId !== conversationId) {
        throw new ForbiddenException('Message does not belong to this conversation');
      }

      // Cannot mark own messages as read
      if (message.senderId === userId) {
        throw new ForbiddenException('Cannot mark your own messages as read');
      }

      const updated = await this.prisma.messageNew.update({
        where: { id: dto.messageId },
        data: { readAt: new Date() },
      });

      this.logger.log(`Message ${dto.messageId} marked as read by user ${userId}`);

      return updated;
    }

    // Mark all unread messages in conversation as read
    if (dto.markAll) {
      const result = await this.prisma.messageNew.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      this.logger.log(`${result.count} messages marked as read by user ${userId} in conversation ${conversationId}`);

      return { count: result.count };
    }

    throw new NotFoundException('Invalid request');
  }

  /**
   * Get total unread count for a user
   */
  async getUnreadCount(userId: number) {
    const unreadCount = await this.prisma.messageNew.count({
      where: {
        conversation: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'ACTIVE',
        },
        senderId: { not: userId },
        readAt: null,
      },
    });

    return { unreadCount };
  }

  /**
   * Sanitize message content to prevent XSS
   * NFR-MSG-SEC-004: XSS sanitization
   */
  private sanitizeMessageContent(content: string): string {
    // Use DOMPurify to strip HTML tags and prevent XSS
    const sanitized = purify.sanitize(content, {
      ALLOWED_TAGS: [], // Disallow all HTML tags
      ALLOWED_ATTR: [], // Disallow all attributes
      KEEP_CONTENT: true, // Keep text content
    });

    return sanitized.trim();
  }

  /**
   * Validate message content
   */
  validateMessageContent(content: string, messageType: MessageType): { valid: boolean; error?: string } {
    if (messageType === 'TEXT') {
      if (!content || content.trim().length === 0) {
        return { valid: false, error: 'Text message cannot be empty' };
      }

      if (content.length > 5000) {
        return { valid: false, error: 'Message too long (max 5000 characters)' };
      }
    }

    if (messageType === 'IMAGE') {
      if (content && content.trim().length > 500) {
        return { valid: false, error: 'Image caption too long (max 500 characters)' };
      }
    }

    return { valid: true };
  }

  /**
   * Send push notification if recipient is offline
   * Phase 5: Push Notifications
   */
  private async sendPushNotificationIfNeeded(
    conversation: any,
    senderId: number,
    message: any,
  ): Promise<void> {
    // Determine recipient
    const recipientId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id;

    // Check if recipient is online
    const recipientPresence = await this.presenceService.getUserPresence(recipientId);

    if (recipientPresence && recipientPresence.status === 'ONLINE') {
      this.logger.debug(`Recipient ${recipientId} is online, skipping push notification`);
      return;
    }

    // Get sender name
    const senderName =
      message.sender.workerProfile?.firstName ||
      message.sender.businessProfiles?.[0]?.businessName ||
      'Someone';

    // Check notification preferences
    const preferences = await this.notificationsService.findByUserId(recipientId);

    if (preferences && !preferences.enablePush) {
      this.logger.debug(`User ${recipientId} has disabled push notifications`);
      return;
    }

    // Send push notification
    await this.notificationsService.notifyNewMessage(recipientId, senderName);

    this.logger.log(`Push notification sent to user ${recipientId} for new message from ${senderName}`);
  }
}
