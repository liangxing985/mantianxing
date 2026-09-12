import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { KookClient, CardBuilder } from '@kookapp/js-sdk';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../config/redis.service';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class KookService implements OnModuleDestroy {
  private readonly logger = new Logger(KookService.name);
  private client: KookClient | null = null;
  private connected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: SystemConfigService,
  ) {}

  /** 连接 Kook WebSocket（带自动重连） */
  async connect() {
    if (this.connected) return;
    const token = process.env.KOOK_BOT_TOKEN;
    if (!token) return;

    try {
      this.client = new KookClient({ botToken: token, compression: false } as any);

      // 监听所有事件（统一处理按钮点击）
      (this.client as any).on('event', (event: any) => {
        const extra = event?.extra || {};
        const eventType = event?.type || extra?.type || 'unknown';

        // 按钮点击事件
        if (extra.type === 'message_btn_click' || eventType === 'message_btn_click') {
          const body = extra.body || {};
          const kookUserId = body.user_id || event?.user_id;
          const value = body.value || event?.value;
          const msgId = body.msg_id || event?.msg_id;

          this.logger.log(`【按钮点击】用户=${kookUserId}, value=${value}`);

          if (value && String(value).startsWith('grab:')) {
            const orderId = parseInt(String(value).split(':')[1], 10);
            if (orderId) {
              this.handleGrabOrder(kookUserId, orderId, msgId).catch(e =>
                this.logger.error('抢单失败', e)
              );
            }
          }
        }
      });

      // 监听频道消息（处理 /绑定 指令）
      this.client.on('textChannelEvent', (event: any) => {
        this.handleChannelMessage(event).catch((e) =>
          this.logger.error('处理频道消息失败', e),
        );
      });

      // 监听断开连接，自动重连
      (this.client as any).on('disconnect', () => {
        this.logger.warn('Kook WebSocket 断开，5秒后重连...');
        this.connected = false;
        this.scheduleReconnect();
      });

      await this.client.connect();
      this.connected = true;
      this.logger.log('✅ Kook 机器人已连接（WebSocket模式）');
    } catch (e) {
      this.logger.error('Kook 连接失败，5秒后重连...', e);
      this.connected = false;
      this.scheduleReconnect();
    }
  }

  /** 定时重连 */
  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  /** 发送抢单卡片到指定频道 */
  async sendOrderCard(order: any) {
    if (!this.connected || !this.client) return;
    const channelId = process.env.KOOK_ORDER_CHANNEL_ID;
    if (!channelId) {
      this.logger.warn('未配置 KOOK_ORDER_CHANNEL_ID，跳过发单');
      return;
    }

    try {
      const card = await this.buildOrderCard(order);
      const res: any = await this.client.api.createMessage({
        type: 10,
        target_id: channelId,
        content: card,
      });

      const msgId = res?.data?.msg_id || res?.msg_id;
      if (msgId) {
        await this.redis.set(
          `kook:msg:${order.id}`,
          JSON.stringify({ msgId, channelId }),
          86400 * 7,
        );
      }
      this.logger.log(`📢 订单 ${order.orderNo} 已推送到 Kook 抢单频道`);
    } catch (e) {
      this.logger.error('发送 Kook 卡片失败', e);
    }
  }

  /** 抢单成功后更新卡片状态 */
  async updateOrderCard(order: any, providerName: string) {
    if (!this.connected || !this.client) return;

    try {
      const msgData = await this.redis.get(`kook:msg:${order.id}`);
      if (!msgData) return;
      const { msgId } = JSON.parse(msgData);

      const card = this.buildTakenCard(order, providerName);
      await this.client.api.updateMessage({
        msg_id: msgId,
        content: card,
      });
    } catch (e) {
      this.logger.error('更新 Kook 卡片失败', e);
    }
  }

  /** 构建抢单卡片（手动构建，确保按钮有click=return-val） */
  private async buildOrderCard(order: any): Promise<string> {
    const gameName = order.serviceItem?.game?.name || '未知游戏';
    const serviceName = order.serviceItem?.name || '未知服务';
    const customerName = order.customer?.nickname || '匿名老板';
    const unit = order.serviceItem?.unit === 'hour' ? '小时' : order.serviceItem?.unit === 'game' ? '局' : '段';
    const coinRate = await this.configService.getNumber('coin_exchange_rate') || 10;
    const rmbAmount = (order.totalAmount / coinRate).toFixed(1);

    const card = [
      {
        type: 'card',
        theme: 'info',
        color: '#6c5ce7',
        size: 'lg',
        modules: [
          { type: 'header', text: { type: 'plain-text', content: '🎮 新订单待抢' } },
          { type: 'divider' },
          { type: 'section', text: { type: 'kmarkdown', content: `**游戏：** ${gameName} / ${serviceName}` } },
          { type: 'section', text: { type: 'kmarkdown', content: `**⏱ 时长：** ${order.duration}${unit}` } },
          { type: 'section', text: { type: 'kmarkdown', content: `**💰 价格：** ${order.totalAmount} 星石（约 ${rmbAmount}元）` } },
          { type: 'section', text: { type: 'kmarkdown', content: `**👤 老板：** ${customerName}` } },
          { type: 'section', text: { type: 'kmarkdown', content: `**📝 要求：** ${order.requirement || '无特殊要求'}` } },
          { type: 'divider' },
          { type: 'context', elements: [{ type: 'plain-text', content: `订单号：${order.orderNo} · 发布于 ${new Date().toLocaleString('zh-CN')}` }] },
          {
            type: 'action-group',
            elements: [
              {
                type: 'button',
                theme: 'primary',
                value: `grab:${order.id}`,
                click: 'return-val',
                text: { type: 'plain-text', content: '🔥 立即抢单' },
              },
            ],
          },
        ],
      },
    ];

    return JSON.stringify(card);
  }

  /** 构建已接单卡片 */
  private buildTakenCard(order: any, providerName: string): string {
    const gameName = order.serviceItem?.game?.name || '';
    const serviceName = order.serviceItem?.name || '';

    return CardBuilder.fromTemplate()
      .size('lg')
      .theme('none')
      .color('#52c41a')
      .addKMarkdownText(`**✅ 已接单**`)
      .addDivider()
      .addKMarkdownText(`**游戏：** ${gameName} / ${serviceName}`)
      .addKMarkdownText(`**陪玩：** ${providerName}`)
      .addKMarkdownText(`**💰 价格：** ${order.totalAmount} 星石`)
      .addDivider()
      .addContext(`订单 ${order.orderNo} 已被接单，请双方尽快联系`)
      .build();
  }

  /** 处理频道消息（/绑定 指令） */
  async handleChannelMessage(event: any) {
    const content = event?.content || '';
    const userId = event?.author_id || event?.extra?.author?.id;
    const channelId = event?.target_id || event?.extra?.channel_id;

    if (!content || !userId) return;

    // /绑定 用户名 密码
    const bindMatch = content.match(/^\/绑定\s+(\S+)\s+(\S+)/);
    if (bindMatch) {
      await this.handleBind(userId, channelId, bindMatch[1], bindMatch[2]);
      return;
    }

    // /解绑
    if (content.trim() === '/解绑') {
      await this.handleUnbind(userId, channelId);
      return;
    }

    // /帮助
    if (content.trim() === '/帮助' || content.trim() === '/help') {
      await this.sendHelp(channelId);
      return;
    }

    // /抢单 订单号
    const grabMatch = content.match(/^\/抢单\s+(\S+)/);
    if (grabMatch) {
      const orderInput = grabMatch[1];
      let orderId = parseInt(orderInput, 10);
      if (isNaN(orderId)) {
        const order = await this.prisma.order.findUnique({ where: { orderNo: orderInput } });
        if (order) orderId = order.id;
      }
      if (orderId) {
        await this.handleGrabOrder(userId, orderId, null);
      } else {
        await this.reply(channelId, '❌ 订单不存在，请检查订单号');
      }
    }
  }

  /** 绑定 Kook 用户到平台账号 */
  private async handleBind(kookUserId: string, channelId: string, username: string, password: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { username } });
      if (!user) {
        await this.reply(channelId, '❌ 用户名不存在');
        return;
      }

      const bcrypt = await import('bcryptjs');
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        await this.reply(channelId, '❌ 密码错误');
        return;
      }

      if (user.role !== 'PROVIDER') {
        await this.reply(channelId, '❌ 仅陪玩账号可绑定 Kook 抢单');
        return;
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { kookId: kookUserId },
      });

      await this.reply(
        channelId,
        `✅ 绑定成功！\n昵称：${user.nickname}\n现在可以在抢单频道点击按钮抢单了`,
      );
    } catch (e) {
      this.logger.error('绑定失败', e);
      await this.reply(channelId, '❌ 绑定失败，请稍后重试');
    }
  }

  /** 解绑 */
  private async handleUnbind(kookUserId: string, channelId: string) {
    const user = await this.prisma.user.findUnique({ where: { kookId: kookUserId } });
    if (!user) {
      await this.reply(channelId, '❌ 您尚未绑定账号');
      return;
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { kookId: null },
    });
    await this.reply(channelId, '✅ 已解绑');
  }

  /** 发送帮助 */
  private async sendHelp(channelId: string) {
    await this.reply(
      channelId,
      `**漫天星电竞 Kook 机器人**\n\n` +
        `**陪玩绑定：**\n` +
        `\`/绑定 用户名 密码\` - 绑定平台账号（仅陪玩）\n` +
        `\`/解绑\` - 解除绑定\n\n` +
        `**抢单：**\n` +
        `在抢单频道点击订单卡片上的「立即抢单」按钮即可\n` +
        `或发送 \`/抢单 订单号\` 文字抢单\n\n` +
        `**老板下单：**\n` +
        `请在 H5 网页端下单，订单会自动推送到本频道`,
    );
  }

  /** Kook 端抢单逻辑 */
  async handleGrabOrder(kookUserId: string, orderId: number, msgId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { kookId: kookUserId },
        include: { providerProfile: true },
      });

      if (!user) {
        await this.sendPrivateMessage(kookUserId, '❌ 您尚未绑定平台账号\n请发送 `/绑定 用户名 密码` 进行绑定');
        return;
      }

      if (user.role !== 'PROVIDER' || !user.providerProfile) {
        await this.sendPrivateMessage(kookUserId, '❌ 仅陪玩可以抢单');
        return;
      }

      if (!user.providerProfile.acceptOrder || !user.providerProfile.isOnline) {
        await this.sendPrivateMessage(kookUserId, '❌ 请先在陪玩端开启「在线接单」状态');
        return;
      }

      const lockKey = `order:grab:${orderId}`;
      const locked = await this.redis.lock(lockKey, user.id.toString(), 10);
      if (!locked) {
        await this.sendPrivateMessage(kookUserId, '❌ 手慢了，订单已被其他人抢走');
        return;
      }

      try {
        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: { serviceItem: { include: { game: true } }, customer: true },
        });

        if (!order || order.status !== 'PAID') {
          await this.sendPrivateMessage(kookUserId, '❌ 订单不存在或已被接单');
          return;
        }

        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'ASSIGNED',
            providerId: user.id,
            acceptedAt: new Date(),
          },
        });

        await this.updateOrderCard(order, user.nickname);

        await this.sendPrivateMessage(
          kookUserId,
          `✅ 抢单成功！\n\n` +
            `订单：${order.orderNo}\n` +
            `游戏：${order.serviceItem?.game?.name} / ${order.serviceItem?.name}\n` +
            `金额：${order.totalAmount} 星石\n` +
            `老板联系方式：${order.contactType} ${order.contactValue}\n\n` +
            `请尽快联系老板开始服务`,
        );

        if (order.customer?.kookId) {
          await this.sendPrivateMessage(
            order.customer.kookId,
            `📢 您的订单已被接单！\n\n` +
              `陪玩：${user.nickname}\n` +
              `订单：${order.orderNo}\n` +
              `请保持联系方式畅通`,
          );
        }

        this.logger.log(`🎯 Kook 抢单成功：订单${order.orderNo} -> ${user.nickname}`);
      } finally {
        await this.redis.unlock(lockKey, user.id.toString());
      }
    } catch (e) {
      this.logger.error('Kook 抢单处理失败', e);
      await this.sendPrivateMessage(kookUserId, '❌ 抢单失败，请稍后重试');
    }
  }

  /** 发送频道消息 */
  private async reply(channelId: string, content: string) {
    if (!this.client) return;
    await this.client.api.createMessage({
      type: 1,
      target_id: channelId,
      content,
    });
  }

  /** 发送私聊消息 */
  private async sendPrivateMessage(userId: string, content: string) {
    if (!this.client) return;
    try {
      const res: any = await this.client.api.request(
        '/api/v3/user-chat/create',
        'POST',
        { target_id: userId },
      );
      const chatCode = res?.data?.chat_code;
      if (chatCode) {
        await this.client.api.createMessage({
          type: 1,
          target_id: chatCode,
          content,
        });
      }
    } catch (e) {
      this.logger.error(`发送私聊消息失败 userId=${userId}`, e);
    }
  }

  async onModuleDestroy() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.client) {
      this.client.disconnect();
      this.connected = false;
    }
  }
}
