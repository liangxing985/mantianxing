import { Controller, Get, Put, Param, Query, UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('message')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // 消息列表
  @Get('list')
  async getMessageList(@CurrentUser() user: any, @Query() query: any) {
    return this.messageService.getMessageList(user.id, query);
  }

  // 未读数量
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.messageService.getUnreadCount(user.id);
    return { count };
  }

  // 标记已读
  @Put(':id/read')
  async markAsRead(@CurrentUser() user: any, @Param('id') id: number) {
    return this.messageService.markAsRead(user.id, id);
  }

  // 全部已读
  @Put('read-all')
  async markAllAsRead(@CurrentUser() user: any) {
    return this.messageService.markAllAsRead(user.id);
  }
}
