import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers = new Map<string, number>(); // socketId -> userId

  @WebSocketServer() server: Server;

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.onlineUsers.set(client.id, Number(userId));
      client.join(`user_${userId}`);
      this.logger.log(`用户 ${userId} 连接聊天`);
    }
  }

  handleDisconnect(client: Socket) {
    this.onlineUsers.delete(client.id);
  }

  @SubscribeMessage('send_message')
  async handleMessage(client: Socket, payload: { conversationId: number; content: string; type?: string }) {
    const userId = this.onlineUsers.get(client.id);
    if (!userId) return;
    try {
      const msg = await this.chatService.sendMessage(userId, payload.conversationId, payload.content, payload.type || 'text');
      // 推送给目标用户
      this.server.to(`user_${msg.targetId}`).emit('new_message', msg);
      // 推送给发送者自己（多端同步）
      this.server.to(`user_${userId}`).emit('new_message', msg);
      return { success: true, data: msg };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: { conversationId: number; isTyping: boolean }) {
    const userId = this.onlineUsers.get(client.id);
    if (!userId) return;
    client.broadcast.to(`conv_${payload.conversationId}`).emit('user_typing', { userId, isTyping: payload.isTyping });
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(client: Socket, payload: { conversationId: number }) {
    client.join(`conv_${payload.conversationId}`);
  }
}
