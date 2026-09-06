import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPagination } from '../../common/utils';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  // 发送消息
  async sendMessage(data: {
    userId: number;
    type: 'SYSTEM' | 'ORDER' | 'NOTICE';
    title: string;
    content: string;
    orderId?: number;
  }) {
    return this.prisma.message.create({ data });
  }

  // 批量发送消息
  async sendBatchMessages(userIds: number[], data: Omit<Parameters<typeof this.sendMessage>[0], 'userId'>) {
    if (userIds.length === 0) return;
    await this.prisma.message.createMany({
      data: userIds.map((userId) => ({ ...data, userId })),
    });
  }

  // 获取消息列表
  async getMessageList(userId: number, query: any) {
    const { skip, take, page, pageSize } = getPagination(query.page, query.pageSize);
    const where: any = { userId };
    if (query.type) where.type = query.type;
    if (query.isRead !== undefined) where.isRead = query.isRead === 'true';

    const [messages, total, unreadCount] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count({ where }),
      this.prisma.message.count({ where: { userId, isRead: false } }),
    ]);

    return { list: messages, total, page, pageSize, unreadCount };
  }

  // 标记已读
  async markAsRead(userId: number, messageId: number) {
    await this.prisma.message.updateMany({
      where: { id: messageId, userId },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  // 全部已读
  async markAllAsRead(userId: number) {
    await this.prisma.message.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  // 获取未读数量
  async getUnreadCount(userId: number) {
    return this.prisma.message.count({ where: { userId, isRead: false } });
  }
}
