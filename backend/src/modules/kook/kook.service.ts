import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { KookClient, CardBuilder } from '@kookapp/js-sdk';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../config/redis.service';

@Injectable()
export class KookService implements OnModuleDestroy {
  private readonly logger = new Logger(KookService.name);
  private client: KookClient | null = null;
  private connected = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** 初始化 Kook HTTP 客户端（webhook模式下使用，不建立WebSocket连接） */
  async initHttpClient() {
    const token = process.env.KOOK_BOT_TOKEN;
    if (!token) return;

    try {
      this.client = new KookClient({ botToken: token, compression: false } as any);
      this.connected = true; // 标记为已连接，允许发送HTTP API请求
      this.logger.log('✅ Kook HTTP 客户端已初始化（webhook模式）');
    } catch (e) {
      this.logger.error('初始化 Kook HTTP 客户端失败', e);
    }
  }

  /** 连接 Kook WebSocket */
  async connect() {
    if (this.connected) return;
    const token = process.env.KOOK_BOT_TOKEN;
    if (!token) return;

    try {
      // 关闭压缩，减少连接问题
      this.client = new KookClient({ botToken: token, compression: false } as any);

      // 调试：监听所有事件
      (this.client as any).on('event', (event: any) => {
        const eventType = event?.type || event?.extra?.type || 'unknown';
        this.logger.log(`[Kook事件] type=${eventType}, content=${JSON.stringify(event)?.substring(0, 300)}`);

        // 直接在通用事件中处理按钮点击
        const extra = event?.extra || {};
        if (extra.type === 'message_btn_click' || eventType === 'message_btn_click') {
          const body = extra.body || {};
          const kookUserId = body.user_id || event?.user_id;
          const value = body.value || event?.value;
          const msgId = body.msg_id || event?.msg_id;

          if (value && String(value).startsWith('grab:')) {
            const orderId = parseInt(String(value).split(':')[1], 10);
            if (orderId) {
              this.logger.log(`按钮抢单: 用户=${kookUserId}, 订单=${orderId}`);
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

      // 监听按钮点击事件（Kook SDK 标准事件名）
      (this.client as any).on('messageBtnClick', (event: any) => {
        this.logger.log('收到按钮点击事件:', JSON.stringify(event)?.substring(0, 200));
        this.handleButtonClick(event).catch((e) =>
          this.logger.error('处理按钮点击失败', e),
        );
      });

      // 监听系统事件（兼容旧版本SDK）
      (this.client as any).on('systemEvent', (event: any) => {
        this.logger.log('收到系统事件:', JSON.stringify(event)?.substring(0, 200));
        this.handleSystemEvent(event).catch((e) =>
          this.logger.error('处理系统事件失败', e),
        );
      });

      await this.client.connect();
      this.connected = true;
      this.logger.log('✅ Kook 机器人已连接');

      // 延迟2秒后监听原始 WebSocket 消息，确保连接完全建立
      setTimeout(() => {
        try {
          const clientAny = this.client as any;
          this.logger.log(`client keys: ${Object.keys(clientAny).join(',')}`);
          this.logger.log(`ws exists: ${!!clientAny.ws}`);

          const ws = clientAny.ws;
          if (ws) {
            this.logger.log(`ws keys: ${Object.keys(ws).join(',')}`);
            this.logger.log(`webSocket exists: ${!!ws.webSocket}`);

            if (ws.webSocket) {
              ws.webSocket.on('message', (data: any) => {
                try {
                  const msg = JSON.parse(data.toString());
                  if (msg?.s === 0 && msg?.d) {
                    const eventType = msg.d?.type;
                    const extraType = msg.d?.extra?.type;
                    if (extraType === 'message_btn_click' || eventType === 255) {
                      this.logger.log(`[原始WS] type=${eventType}, extraType=${extraType}, sn=${msg.sn}, data=${JSON.stringify(msg.d)?.substring(0, 300)}`);
                    }

                    if (extraType === 'message_btn_click') {
                      const body = msg.d.extra.body || {};
                      const kookUserId = body.user_id;
                      const value = body.value;
                      const msgId = body.msg_id;
                      this.logger.log(`[按钮点击] 用户=${kookUserId}, value=${value}`);

                      if (value && String(value).startsWith('grab:')) {
                        const orderId = parseInt(String(value).split(':')[1], 10);
                        if (orderId) {
                          this.handleGrabOrder(kookUserId, orderId, msgId).catch(e =>
                            this.logger.error('抢单失败', e)
                          );
                        }
                      }
                    }
                  }
                } catch (e) {
                  // 忽略
                }
              });
              this.logger.log('✅ 已监听原始 WebSocket 消息');
            }
          }
        } catch (e) {
          this.logger.warn('无法监听原始 WebSocket', e);
        }
      }, 2000);
    } catch (e) {
      this.logger.error('Kook 机器人连接失败', e);
    }
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
      const card = this.buildOrderCard(order);
      const res: any = await this.client.api.createMessage({
        type: 10, // 卡片消息
        target_id: channelId,
        content: card,
      });

      // 记录消息ID，用于后续更新卡片
      const msgId = res?.data?.msg_id || res?.msg_id;
      if (msgId) {
        await this.redis.set(
          `kook:msg:${order.id}`,
          JSON.stringify({ msgId, channelId }),
          86400 * 7, // 保留7天
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

  /** 构建抢单卡片 */
  private buildOrderCard(order: any): string {
    const gameName = order.serviceItem?.game?.name || '未知游戏';
    const serviceName = order.serviceItem?.name || '未知服务';
    const customerName = order.customer?.nickname || '匿名老板';
    const unit = order.unit === 'hour' ? '小时' : order.unit === 'game' ? '局' : '段';

    return CardBuilder.fromTemplate()
      .size('lg')
      .theme('info')
      .color('#6c5ce7')
      .addKMarkdownText(`**🎮 新订单待抢**`)
      .addDivider()
      .addKMarkdownText(`**游戏：** ${gameName} / ${serviceName}`)
      .addKMarkdownText(`**⏱ 时长：** ${order.duration}${unit}`)
      .addKMarkdownText(`**💰 价格：** ${order.totalAmount} 星石（约 ${(order.totalAmount / 10).toFixed(1)}元）`)
      .addKMarkdownText(`**👤 老板：** ${customerName}`)
      .addKMarkdownText(`**📝 要求：** ${order.requirement || '无特殊要求'}`)
      .addDivider()
      .addContext(`订单号：${order.orderNo} · 发布于 ${new Date().toLocaleString('zh-CN')}`)
      .addActionGroup([
        {
          text: '🔥 立即抢单',
          value: `grab:${order.id}`,
          theme: 'primary',
        },
      ])
      .build();
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

    // /抢单 订单号（支持数字ID或订单号）
    const grabMatch = content.match(/^\/抢单\s+(\S+)/);
    if (grabMatch) {
      const orderInput = grabMatch[1];
      this.logger.log(`文字抢单: 用户=${userId}, 输入=${orderInput}`);

      // 先尝试按数字ID查找
      let orderId = parseInt(orderInput, 10);
      if (isNaN(orderId)) {
        // 如果不是数字，按订单号查找
        const order = await this.prisma.order.findUnique({ where: { orderNo: orderInput } });
        if (order) orderId = order.id;
      }

      if (orderId) {
        await this.handleGrabOrder(userId, orderId, null);
      } else {
        await this.reply(channelId, '❌ 订单不存在，请检查订单号');
      }
      return;
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

  /** 处理按钮点击事件（新版SDK） */
  private async handleButtonClick(event: any) {
    const extra = event?.extra || event?.body || event;
    const { user_id: kookUserId, value, msg_id: msgId } = extra || {};

    if (!value || !String(value).startsWith('grab:')) return;

    const orderId = parseInt(String(value).split(':')[1], 10);
    if (!orderId) return;

    this.logger.log(`用户 ${kookUserId} 点击抢单按钮，订单ID: ${orderId}`);
    await this.handleGrabOrder(kookUserId, orderId, msgId);
  }

  /** 处理系统事件（按钮点击抢单） */
  private async handleSystemEvent(event: any) {
    const extra = event?.extra || event;
    if (extra?.type !== 'message_btn_click') return;

    const { user_id: kookUserId, value, msg_id: msgId } = extra.body || {};
    if (!value || !value.startsWith('grab:')) return;

    const orderId = parseInt(value.split(':')[1], 10);
    if (!orderId) return;

    await this.handleGrabOrder(kookUserId, orderId, msgId);
  }

  /** Kook 端抢单逻辑（与 H5 共享 Redis 分布式锁） */
  async handleGrabOrder(kookUserId: string, orderId: number, msgId: string) {
    try {
      // 1. 查找绑定的平台用户
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

      // 2. Redis 分布式锁抢单（和 H5 端同一把锁）
      const lockKey = `order:grab:${orderId}`;
      const locked = await this.redis.lock(lockKey, user.id.toString(), 10);
      if (!locked) {
        await this.sendPrivateMessage(kookUserId, '❌ 手慢了，订单已被其他人抢走');
        return;
      }

      try {
        // 3. 检查订单状态
        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: { serviceItem: { include: { game: true } }, customer: true },
        });

        if (!order || order.status !== 'PAID') {
          await this.sendPrivateMessage(kookUserId, '❌ 订单不存在或已被接单');
          return;
        }

        // 4. 更新订单状态
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'ASSIGNED',
            providerId: user.id,
            acceptedAt: new Date(),
          },
        });

        // 5. 更新 Kook 卡片为已接单
        await this.updateOrderCard(order, user.nickname);

        // 6. 通知抢单成功
        await this.sendPrivateMessage(
          kookUserId,
          `✅ 抢单成功！\n\n` +
            `订单：${order.orderNo}\n` +
            `游戏：${order.serviceItem?.game?.name} / ${order.serviceItem?.name}\n` +
            `金额：${order.totalAmount} 星石\n` +
            `老板联系方式：${order.contactType} ${order.contactValue}\n\n` +
            `请尽快联系老板开始服务`,
        );

        // 7. 通知老板（如果老板也绑定了Kook）
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
      type: 1, // 纯文本/KMarkdown
      target_id: channelId,
      content,
    });
  }

  /** 发送私聊消息 */
  private async sendPrivateMessage(userId: string, content: string) {
    if (!this.client) return;
    try {
      // 先创建私聊会话，再发消息
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
    if (this.client) {
      this.client.disconnect();
      this.connected = false;
    }
  }
}
