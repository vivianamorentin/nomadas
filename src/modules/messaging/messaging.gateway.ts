import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { MessagingService } from './messaging.service';

/**
 * Messaging Gateway
 * Handles WebSocket connections for real-time messaging
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/messages',
})
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MessagingGateway.name);

  constructor(private readonly messagingService: MessagingService) {}

  afterInit(server: any) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinThread')
  handleJoinThread(
    @MessageBody('threadId') threadId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`thread:${threadId}`);
    this.logger.log(`Client ${client.id} joined thread ${threadId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { threadId: number; senderId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagingService.sendMessage(
      data.threadId,
      data.senderId,
      data.content,
    );

    // Broadcast to thread participants
    client.to(`thread:${data.threadId}`).emit('newMessage', message);
    client.emit('messageSent', message);

    this.logger.log(`Message sent in thread ${data.threadId}`);
  }
}
