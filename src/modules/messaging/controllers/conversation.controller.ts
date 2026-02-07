import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ConversationService } from '../services/conversation.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { QueryConversationsDto } from '../dto/query-conversations.dto';

/**
 * Conversation Controller
 * SPEC-MSG-001 Phase 2
 * REST endpoints for conversation management
 */
@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  /**
   * Create a new conversation
   * REQ-MSG-002: Messaging only after job application
   */
  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot create conversation' })
  @Throttle({ default: { limit: 20, ttl: 3600 } }) // 20 conversations/hour
  async createConversation(@Request() req, @Body() dto: CreateConversationDto) {
    const userId = req.user.userId;
    return this.conversationService.createConversation(userId, dto);
  }

  /**
   * Get user's conversations
   */
  @Get()
  @ApiOperation({ summary: 'Get list of user conversations' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  @Throttle({ default: { limit: 60, ttl: 3600 } }) // 60 requests/hour
  async findConversations(@Request() req, @Query() query: QueryConversationsDto) {
    const userId = req.user.userId;
    return this.conversationService.findConversations(userId, query);
  }

  /**
   * Get conversation by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get conversation details' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access' })
  @Throttle({ default: { limit: 60, ttl: 3600 } })
  async findConversationById(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.conversationService.findConversationById(id, userId);
  }

  /**
   * Archive conversation
   * REQ-MSG-008: No message deletion (archive only)
   */
  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a conversation' })
  @ApiResponse({ status: 200, description: 'Conversation archived successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access' })
  @Throttle({ default: { limit: 20, ttl: 3600 } })
  async archiveConversation(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.conversationService.archiveConversation(id, userId);
  }

  /**
   * Get unread message count
   */
  @Get('unread-count/count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get total unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @Throttle({ default: { limit: 60, ttl: 3600 } })
  async getUnreadCount(@Request() req) {
    const userId = req.user.userId;
    return this.conversationService.getUnreadCount(userId);
  }

  /**
   * Get unread count for specific conversation
   */
  @Get(':id/unread-count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get unread count for conversation' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @Throttle({ default: { limit: 60, ttl: 3600 } })
  async getConversationUnreadCount(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    const unreadCount = await this.conversationService.getUnreadCount(userId);

    // Filter for this specific conversation
    const conversation = await this.conversationService.findConversationById(id, userId);
    const conversationUnread = unreadCount.unreadCount; // TODO: Filter by conversation

    return { unreadCount: conversationUnread };
  }
}
