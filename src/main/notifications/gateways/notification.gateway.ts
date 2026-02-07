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
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationService } from '../services/notification.service';

/**
 * Notification Gateway
 * WebSocket gateway for real-time in-app notifications
 * SPEC-NOT-001 Phase 4
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Configure appropriately for production
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly userRooms = new Map<string, Set<string>>(); // userId -> Set of socket IDs

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
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
      const userId = payload.sub;

      if (!userId) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      // Join user-specific room
      const roomName = `notifications:${userId}`;
      client.join(roomName);

      // Track socket
      this.trackUserSocket(userId, client.id);

      this.logger.log(`User ${userId} connected with socket ${client.id}`);

      // Send unread count
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unread_count', { count: unreadCount });

    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    // Remove socket tracking
    for (const [userId, sockets] of this.userRooms.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        this.logger.log(`User ${userId} disconnected (socket ${client.id})`);

        // Clean up empty sets
        if (sockets.size === 0) {
          this.userRooms.delete(userId);
        }
        break;
      }
    }
  }

  /**
   * Send notification to user
   * Called by NotificationService when notification is created
   */
  async sendNotificationToUser(userId: string, notification: any) {
    const roomName = `notifications:${userId}`;

    // Check if user has any active connections
    const userSockets = this.userRooms.get(userId);
    const hasActiveConnections = userSockets && userSockets.size > 0;

    if (hasActiveConnections) {
      this.logger.debug(`Sending notification ${notification.id} to user ${userId}`);
      this.server.to(roomName).emit('notification', notification);

      // Update unread count
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      this.server.to(roomName).emit('unread_count', { count: unreadCount });
    } else {
      this.logger.debug(`User ${userId} has no active connections, skipping real-time delivery`);
    }
  }

  /**
   * Handle mark as read event from client
   */
  @SubscribeMessage('mark_read')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const token = this.extractToken(client);
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      await this.notificationService.markAsRead(data.notificationId, userId);

      // Send updated unread count
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unread_count', { count: unreadCount });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle mark all as read event from client
   */
  @SubscribeMessage('mark_all_read')
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      await this.notificationService.markAllAsRead(userId);

      // Send updated unread count
      client.emit('unread_count', { count: 0 });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking all notifications as read: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track user socket for connection monitoring
   */
  private trackUserSocket(userId: string, socketId: string) {
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(socketId);
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
   * Get active connections count for user
   */
  getUserConnectionCount(userId: string): number {
    return this.userRooms.get(userId)?.size || 0;
  }

  /**
   * Get total active connections
   */
  getTotalConnections(): number {
    let total = 0;
    for (const sockets of this.userRooms.values()) {
      total += sockets.size;
    }
    return total;
  }
}
