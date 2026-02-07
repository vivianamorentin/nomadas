import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { ConversationStatus } from '@prisma/client';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { QueryConversationsDto } from '../dto/query-conversations.dto';

/**
 * Conversation Service
 * SPEC-MSG-001 Phase 2
 * Handles conversation CRUD operations
 */
@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new conversation between two users
   * REQ-MSG-002: Messaging only allowed after job application
   */
  async createConversation(userId: number, dto: CreateConversationDto) {
    // Verify job application exists if provided
    if (dto.jobApplicationId) {
      const application = await this.prisma.application.findUnique({
        where: { id: dto.jobApplicationId },
      });

      if (!application) {
        throw new NotFoundException('Job application not found');
      }

      // Verify user is either the worker or the business owner
      const businessProfile = await this.prisma.businessProfile.findFirst({
        where: { userId },
      });

      const isWorker = application.workerId === userId;
      const isBusiness = businessProfile && application.jobPostingId !== undefined;

      // Get job posting to verify business ownership
      let ownsJobPosting = false;
      if (isBusiness && application.jobPostingId) {
        const jobPosting = await this.prisma.jobPosting.findUnique({
          where: { id: application.jobPostingId },
        });
        ownsJobPosting = jobPosting?.businessId === businessProfile.id;
      }

      if (!isWorker && !ownsJobPosting) {
        throw new ForbiddenException(
          'You can only create conversations for your own job applications',
        );
      }

      // Use the other user ID
      const otherUserId = isWorker ? this.getBusinessOwnerId(application.jobPostingId!) : dto.user2Id;
    }

    // Check if conversation already exists
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        user1Id: userId,
        user2Id: dto.user2Id,
        jobApplicationId: dto.jobApplicationId || null,
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        user1Id: userId,
        user2Id: dto.user2Id,
        jobApplicationId: dto.jobApplicationId,
      },
      include: {
        user1: {
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
        user2: {
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
        jobApplication: {
          select: {
            id: true,
            jobPosting: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Conversation created: ${conversation.id} between users ${userId} and ${dto.user2Id}`);

    return conversation;
  }

  /**
   * Get paginated list of user's conversations
   */
  async findConversations(userId: number, query: QueryConversationsDto) {
    const { status = 'ACTIVE', page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: status as ConversationStatus,
        },
        include: {
          user1: {
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
          user2: {
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
          jobApplication: {
            select: {
              id: true,
              jobPosting: {
                select: {
                  title: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              messageType: true,
              senderId: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  senderId: { not: userId },
                  readAt: null,
                },
              },
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: status as ConversationStatus,
        },
      }),
    ]);

    // Transform to add unread count and other user info
    const transformedConversations = conversations.map((conv) => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      const unreadCount = conv._count.messages;

      return {
        id: conv.id,
        status: conv.status,
        lastMessageAt: conv.lastMessageAt,
        jobApplication: conv.jobApplication,
        otherUser: {
          id: otherUser.id,
          firstName: otherUser.workerProfile?.firstName,
          lastName: otherUser.workerProfile?.lastName,
          businessName: otherUser.businessProfiles[0]?.businessName,
          profilePhoto: otherUser.workerProfile?.profilePhoto,
        },
        lastMessage: conv.messages[0] || null,
        unreadCount,
      };
    });

    return {
      data: transformedConversations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get conversation by ID with authorization check
   */
  async findConversationById(id: string, userId: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        user1: {
          select: {
            id: true,
            email: true,
            workerProfile: true,
            businessProfiles: true,
          },
        },
        user2: {
          select: {
            id: true,
            email: true,
            workerProfile: true,
            businessProfiles: true,
          },
        },
        jobApplication: {
          include: {
            jobPosting: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Authorization check: user must be a participant
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    return conversation;
  }

  /**
   * Archive conversation (manual archival)
   */
  async archiveConversation(id: string, userId: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Authorization check
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    const updated = await this.prisma.conversation.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        archivedBy: userId,
      },
    });

    this.logger.log(`Conversation ${id} archived by user ${userId}`);

    return updated;
  }

  /**
   * Get unread message count for user
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
   * Helper: Get business owner ID from job posting ID
   */
  private async getBusinessOwnerId(jobPostingId: number): Promise<number> {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      select: { businessId: true },
    });

    if (!jobPosting) {
      throw new NotFoundException('Job posting not found');
    }

    const business = await this.prisma.businessProfile.findUnique({
      where: { id: jobPosting.businessId },
      select: { userId: true },
    });

    if (!business) {
      throw new NotFoundException('Business profile not found');
    }

    return business.userId;
  }
}
