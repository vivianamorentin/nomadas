import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConversationService } from '../services/conversation.service';
import { MessageService } from '../services/message.service';
import { TypingIndicatorService } from '../services/typing-indicator.service';
import { PresenceService, PresenceStatus } from '../services/presence.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { MarkReadDto } from '../dto/mark-read.dto';

/**
 * Message Gateway
 * WebSocket gateway for real-time messaging
 * SPEC-MSG-001 Phases 3-4
 *
 * Client → Server Events:
 * - authenticate: JWT token validation
 * - join_conversation: Join conversation room
 * - leave_conversation: Leave conversation room
 * - send_message: Send new message
 * - mark_read: Mark message as read
 * - typing_start: Start typing indicator (Phase 4)
 * - typing_stop: Stop typing indicator (Phase 4)
 * - heartbeat: Update presence (Phase 4)
 *
 * Server → Client Events:
 * - message_received: New message delivered
 * - message_sent: Message confirmation (with double checkmarks)
 * - message_read: Read receipt update
 * - user_typing: Typing indicator
 * - user_online: User came online
 * - user_offline: User went offline
 * - unread_count: Unread message count
 * - error: Error response
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Configure appropriately for production
  },
  namespace: '/messaging',
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessageGateway.name);
  private readonly userSockets = new Map<number, Set<string>>(); // userId -> Set of socket IDs
  private readonly conversationRooms = new Map<string, Set<number>>(); // conversationId -> Set of userIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly typingIndicatorService: TypingIndicatorService,
    private readonly presenceService: PresenceService,
  ) {}

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      // Verify JWT token from handshake
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub || payload.userId;

      if (!userId) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      // Attach userId to socket data
      client.data.userId = userId;

      // Track socket
      this.trackUserSocket(userId, client.id);

      // Set presence to ONLINE
      await this.presenceService.setOnline(userId, this.getUserConnectionCount(userId));

      this.logger.log(`User ${userId} connected with socket ${client.id}`);

      // Send initial unread count
      const unreadCount = await this.conversationService.getUnreadCount(userId);
      client.emit('unread_count', unreadCount);

      // Broadcast user online status
      this.broadcastUserOnlineStatus(userId, true);

    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      // Remove socket tracking
      this.untrackUserSocket(userId, client.id);

      // Update presence
      await this.presenceService.setOffline(userId);

      // Check if user has any remaining connections
      const remainingConnections = this.userSockets.get(userId)?.size || 0;

      if (remainingConnections === 0) {
        this.logger.log(`User ${userId} fully disconnected`);
        // Broadcast user offline status
        this.broadcastUserOnlineStatus(userId, false);

        // Clear typing indicators for user
        await this.typingIndicatorService.clearUserTyping(userId);
      } else {
        this.logger.log(`User ${userId} disconnected (socket ${client.id}), ${remainingConnections} connections remaining`);
      }
    }
  }

  /**
   * Join conversation room
   */
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      const { conversationId } = data;

      // Verify user has access to this conversation
      await this.conversationService.findConversationById(conversationId, userId);

      // Join room
      const roomName = `conversation:${conversationId}`;
      client.join(roomName);

      // Track room membership
      this.trackConversationMember(conversationId, userId);

      this.logger.debug(`User ${userId} joined conversation ${conversationId}`);

      return { success: true };

    } catch (error) {
      this.logger.error(`Error joining conversation: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Leave conversation room
   */
  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      const { conversationId } = data;

      // Leave room
      const roomName = `conversation:${conversationId}`;
      client.leave(roomName);

      // Untrack room membership
      this.untrackConversationMember(conversationId, userId);

      this.logger.debug(`User ${userId} left conversation ${conversationId}`);

      return { success: true };

    } catch (error) {
      this.logger.error(`Error leaving conversation: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send message
   * REQ-MSG-001: Real-time messaging
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; message: SendMessageDto },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      const { conversationId, message } = data;

      // Send message via service
      const sentMessage = await this.messageService.sendMessage(conversationId, userId, message);

      const roomName = `conversation:${conversationId}`;

      // Send confirmation to sender (single checkmark - sent)
      client.emit('message_sent', {
        messageId: sentMessage.id,
        status: 'sent',
        timestamp: sentMessage.createdAt,
      });

      // Broadcast message to conversation room (excluding sender)
      client.to(roomName).emit('message_received', {
        conversationId,
        message: sentMessage,
        // Mark as delivered (double checkmark)
        status: 'delivered',
        deliveredAt: sentMessage.deliveredAt,
      });

      this.logger.debug(`Message ${sentMessage.id} sent in conversation ${conversationId}`);

      return { success: true, messageId: sentMessage.id };

    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark message as read
   * REQ-MSG-005: Read receipts
   */
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { conversationId: string; messageId?: string; markAll?: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      const { conversationId, messageId, markAll } = data;

      const dto: MarkReadDto = { messageId, markAll };
      const result = await this.messageService.markAsRead(conversationId, userId, dto);

      const roomName = `conversation:${conversationId}`;

      // Broadcast read receipt to conversation room
      this.server.to(roomName).emit('message_read', {
        conversationId,
        messageId,
        userId,
        readAt: new Date(),
      });

      // Update unread count for sender
      const unreadCount = await this.conversationService.getUnreadCount(userId);
      client.emit('unread_count', unreadCount);

      this.logger.debug(`User ${userId} marked message as read in conversation ${conversationId}`);

      return { success: true, result };

    } catch (error) {
      this.logger.error(`Error marking message as read: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start typing indicator
   * Phase 4: Advanced Features
   */
  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      const { conversationId } = data;

      // Start typing indicator (auto-expires after 10 seconds)
      await this.typingIndicatorService.startTyping(conversationId, userId);

      const roomName = `conversation:${conversationId}`;

      // Broadcast to other participants in conversation
      client.to(roomName).emit('user_typing', {
        conversationId,
        userId,
        isTyping: true,
      });

      this.logger.debug(`User ${userId} started typing in conversation ${conversationId}`);

      return { success: true };

    } catch (error) {
      this.logger.error(`Error starting typing indicator: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop typing indicator
   * Phase 4: Advanced Features
   */
  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      const { conversationId } = data;

      // Stop typing indicator
      await this.typingIndicatorService.stopTyping(conversationId, userId);

      const roomName = `conversation:${conversationId}`;

      // Broadcast to other participants
      client.to(roomName).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false,
      });

      this.logger.debug(`User ${userId} stopped typing in conversation ${conversationId}`);

      return { success: true };

    } catch (error) {
      this.logger.error(`Error stopping typing indicator: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Heartbeat to extend online status
   * Phase 4: Advanced Features
   */
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.userId;

      if (!userId) {
        return { success: false, error: 'Not authenticated' };
      }

      // Update heartbeat (extends ONLINE TTL)
      await this.presenceService.updateHeartbeat(userId);

      return { success: true };

    } catch (error) {
      this.logger.error(`Error updating heartbeat: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get presence status for multiple users
   * Phase 4: Advanced Features
   */
  @SubscribeMessage('get_presence')
  async handleGetPresence(
    @MessageBody() data: { userIds: number[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { userIds } = data;

      // Get bulk presence
      const presenceMap = await this.presenceService.getBulkPresence(userIds);

      // Convert to array
      const presenceArray = Array.from(presenceMap.entries()).map(([userId, data]) => ({
        userId,
        status: data.status,
        lastSeen: data.lastSeen,
      }));

      client.emit('presence_data', presenceArray);

      return { success: true, data: presenceArray };

    } catch (error) {
      this.logger.error(`Error getting presence: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track user socket for connection monitoring
   */
  private trackUserSocket(userId: number, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  /**
   * Untrack user socket
   */
  private untrackUserSocket(userId: number, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Track conversation member
   */
  private trackConversationMember(conversationId: string, userId: number) {
    if (!this.conversationRooms.has(conversationId)) {
      this.conversationRooms.set(conversationId, new Set());
    }
    this.conversationRooms.get(conversationId)!.add(userId);
  }

  /**
   * Untrack conversation member
   */
  private untrackConversationMember(conversationId: string, userId: number) {
    const members = this.conversationRooms.get(conversationId);
    if (members) {
      members.delete(userId);
      if (members.size === 0) {
        this.conversationRooms.delete(conversationId);
      }
    }
  }

  /**
   * Broadcast user online status
   */
  private broadcastUserOnlineStatus(userId: number, isOnline: boolean) {
    // Get all conversations where user is participant
    // For now, broadcast to all connected users
    // In production, you would query user's conversations and broadcast only to those rooms
    const event = isOnline ? 'user_online' : 'user_offline';
    this.server.emit(event, { userId, timestamp: new Date() });
  }

  /**
   * Extract JWT token from socket handshake
   */
  private extractToken(client: Socket): string | undefined {
    const authHeader = client.handshake.auth.token;
    if (authHeader) {
      return authHeader;
    }

    // Fallback: check query parameter
    const token = client.handshake.query.token as string;
    if (token) {
      return token;
    }

    return undefined;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: number): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets !== undefined && sockets.size > 0;
  }

  /**
   * Get active connections count for user
   */
  getUserConnectionCount(userId: number): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  /**
   * Get total active connections
   */
  getTotalConnections(): number {
    let total = 0;
    for (const sockets of this.userSockets.values()) {
      total += sockets.size;
    }
    return total;
  }

  /**
   * Send notification to user (integration with NotificationService)
   * Called when user is offline
   */
  async sendPushNotification(userId: number, notification: any) {
    // Check if user is online
    if (this.isUserOnline(userId)) {
      this.logger.debug(`User ${userId} is online, skipping push notification`);
      return false;
    }

    // User is offline - delegate to NotificationService
    // This would be implemented in Phase 5
    this.logger.debug(`User ${userId} is offline, push notification would be sent here`);
    return true;
  }
}
