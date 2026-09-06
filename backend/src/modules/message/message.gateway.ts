import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MessageGateway.name);
  private userSockets = new Map<number, Set<string>>(); // userId -> socketIds

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const uid = parseInt(userId);
      if (!this.userSockets.has(uid)) {
        this.userSockets.set(uid, new Set());
      }
      this.userSockets.get(uid)!.add(client.id);
      client.join(`user:${uid}`);
      this.logger.log(`用户${uid}连接WebSocket, 当前连接数: ${this.userSockets.get(uid)?.size}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const uid = parseInt(userId);
      const sockets = this.userSockets.get(uid);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(uid);
        }
      }
    }
  }

  // 给指定用户发消息
  sendToUser(userId: number, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // 广播新订单到抢单池
  broadcastNewOrder(order: any) {
    this.server.emit('new:order', order);
  }

  // 心跳
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }
}
