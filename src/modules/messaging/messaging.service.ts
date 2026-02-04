import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';

/**
 * Messaging Service
 * Handles message thread logic
 */
@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async findThreadsByUserId(userId: number) {
    return this.prisma.messageThread.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                email: true,
                workerProfile: true,
                businessProfile: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });
  }

  async findMessagesByThreadId(threadId: number) {
    return this.prisma.message.findMany({
      where: { threadId },
      include: {
        sender: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async createThread(initiatorId: number, participantId: number) {
    return this.prisma.messageThread.create({
      data: {
        participants: {
          create: [
            { userId: initiatorId },
            { userId: participantId },
          ],
        },
      },
    });
  }

  async sendMessage(threadId: number, senderId: number, content: string) {
    return this.prisma.message.create({
      data: {
        threadId,
        senderId,
        content,
      },
    });
  }
}
