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
import { MessageService } from '../services/message.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { QueryMessagesDto } from '../dto/query-messages.dto';
import { MarkReadDto } from '../dto/mark-read.dto';
import { ImageUploadService } from '../services/image-upload.service';
import { RequestImageUploadDto, ConfirmImageUploadDto } from '../dto/image-upload.dto';

/**
 * Message Controller
 * SPEC-MSG-001 Phase 2
 * REST endpoints for message operations
 */
@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations/:conversationId/messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  /**
   * Send message to conversation
   * REQ-MSG-001: Real-time messaging
   * NFR-MSG-SEC-003: Rate limiting (100 messages/hour)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid message content' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a participant' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  @Throttle({ default: { limit: 100, ttl: 3600 } }) // 100 messages/hour
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Request() req,
    @Body() dto: SendMessageDto,
  ) {
    const userId = req.user.userId;

    // Validate message content
    const validation = this.messageService.validateMessageContent(
      dto.content || '',
      dto.messageType as any,
    );

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    return this.messageService.sendMessage(conversationId, userId, dto);
  }

  /**
   * Get messages from conversation
   * NFR-MSG-SCAL-004: Cursor-based pagination
   * NFR-MSG-PERF-004: Load 50 messages in < 1s
   */
  @Get()
  @ApiOperation({ summary: 'Get conversation messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access' })
  @Throttle({ default: { limit: 60, ttl: 3600 } })
  async findMessages(
    @Param('conversationId') conversationId: string,
    @Request() req,
    @Query() query: QueryMessagesDto,
  ) {
    const userId = req.user.userId;
    return this.messageService.findMessages(conversationId, userId, query);
  }

  /**
   * Search messages in conversation
   * NFR-MSG-USAB-003: Message search (full-text)
   */
  @Get('search')
  @ApiOperation({ summary: 'Search messages in conversation' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiResponse({ status: 400, description: 'Bad request - query required' })
  @Throttle({ default: { limit: 30, ttl: 3600 } }) // 30 searches/hour
  async searchMessages(
    @Param('conversationId') conversationId: string,
    @Request() req,
    @Query('q') query: string,
  ) {
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        error: 'Search query is required',
      };
    }

    // TODO: Implement full-text search using PostgreSQL tsvector
    // For now, return empty results
    return {
      data: [],
      meta: {
        query,
        total: 0,
      },
    };
  }

  /**
   * Get image upload URL
   * REQ-MSG-004: Image sharing
   * NFR-MSG-SEC-005: Secure image storage (S3 presigned URLs)
   */
  @Post('images/upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate S3 presigned upload URL for image' })
  @ApiResponse({ status: 200, description: 'Upload URL generated' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a participant' })
  @Throttle({ default: { limit: 10, ttl: 3600 } }) // 10 uploads/hour
  async generateUploadUrl(
    @Param('conversationId') conversationId: string,
    @Request() req,
    @Body() dto: RequestImageUploadDto,
  ) {
    const userId = req.user.userId;
    return this.imageUploadService.generateUploadUrl(conversationId, userId, dto);
  }

  /**
   * Confirm image upload
   */
  @Post('images/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm image upload and create record' })
  @ApiResponse({ status: 200, description: 'Upload confirmed' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async confirmUpload(
    @Param('conversationId') conversationId: string,
    @Request() req,
    @Body() dto: ConfirmImageUploadDto,
  ) {
    const userId = req.user.userId;
    const { messageId } = dto as any; // Extract messageId from DTO

    return this.imageUploadService.confirmUpload(conversationId, userId, messageId, dto);
  }
}

/**
 * Message Read Receipt Controller
 * SPEC-MSG-001 Phase 2
 */
@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessageReadController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * Mark message as read
   * REQ-MSG-005: Read receipts
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @Throttle({ default: { limit: 100, ttl: 3600 } })
  async markMessageRead(@Param('id') id: string, @Request() req, @Body() dto: MarkReadDto) {
    const userId = req.user.userId;
    return this.messageService.markAsRead(id, userId, dto);
  }
}
