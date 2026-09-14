import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private prisma: PrismaService) {}

  // 获取或创建会话
  async getOrCreateConversation(userId: number, targetUserId: number) {
    if (userId === targetUserId) throw new BadRequestException('不能和自己聊天');
    const [u1, u2] = userId < targetUserId ? [userId, targetUserId] : [targetUserId, userId];
    let conv = await this.prisma.conversation.findUnique({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
      include: {
        user1: { select: { id: true, nickname: true, avatar: true } },
        user2: { select: { id: true, nickname: true, avatar: true } },
      },
    });
    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: { user1Id: u1, user2Id: u2 },
        include: {
          user1: { select: { id: true, nickname: true, avatar: true } },
          user2: { select: { id: true, nickname: true, avatar: true } },
        },
      });
    }
    return conv;
  }

  // 获取会话列表
  async getConversationList(userId: number) {
    const convs = await this.prisma.conversation.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      include: {
        user1: { select: { id: true, nickname: true, avatar: true } },
        user2: { select: { id: true, nickname: true, avatar: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
    return convs.map(c => ({
      ...c,
      target: c.user1Id === userId ? c.user2 : c.user1,
      unread: c.user1Id === userId ? c.user1Unread : c.user2Unread,
    }));
  }

  // 获取历史消息
  async getMessages(userId: number, conversationId: number, page = 1, pageSize = 50) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv || (conv.user1Id !== userId && conv.user2Id !== userId)) {
      throw new BadRequestException('无权访问该会话');
    }
    const skip = (page - 1) * pageSize;
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });
    // 标记已读
    const unreadField = conv.user1Id === userId ? 'user1Unread' : 'user2Unread';
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { [unreadField]: 0 } });
    return messages.reverse();
  }

  // 发送消息
  async sendMessage(userId: number, conversationId: number, content: string, type = 'text') {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new BadRequestException('会话不存在');
    const targetId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
    const unreadField = conv.user1Id === userId ? 'user2Unread' : 'user1Unread';
    const msg = await this.prisma.chatMessage.create({
      data: { conversationId, senderId: userId, content, type },
      include: { sender: { select: { id: true, nickname: true, avatar: true } } },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessage: content.slice(0, 100), lastMessageAt: new Date(), [unreadField]: { increment: 1 } },
    });
    return { ...msg, targetId };
  }
}
