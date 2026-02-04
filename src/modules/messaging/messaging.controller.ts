import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';

@ApiTags('messaging')
@Controller('threads')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get()
  @ApiOperation({ summary: 'Get my message threads' })
  async getMyThreads(@Request() req) {
    return this.messagingService.findThreadsByUserId(req.user.userId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages in thread' })
  async getMessages(@Param('id') threadId: string) {
    return this.messagingService.findMessagesByThreadId(parseInt(threadId));
  }

  @Post()
  @ApiOperation({ summary: 'Start new conversation' })
  async startThread(@Request() req, @Body('participantId') participantId: number) {
    return this.messagingService.createThread(req.user.userId, participantId);
  }
}
