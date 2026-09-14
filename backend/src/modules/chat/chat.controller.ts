import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversation/:targetUserId')
  async getOrCreate(@CurrentUser() user: any, @Param('targetUserId') targetUserId: string) {
    return this.chatService.getOrCreateConversation(user.id, Number(targetUserId));
  }

  @Get('conversations')
  async getList(@CurrentUser() user: any) {
    return this.chatService.getConversationList(user.id);
  }

  @Get('messages/:conversationId')
  async getMessages(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    return this.chatService.getMessages(user.id, Number(conversationId), Number(page), Number(pageSize));
  }

  @Post('messages/:conversationId')
  async sendMessage(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Body() body: { content: string; type?: string },
  ) {
    return this.chatService.sendMessage(user.id, Number(conversationId), body.content, body.type || 'text');
  }
}
