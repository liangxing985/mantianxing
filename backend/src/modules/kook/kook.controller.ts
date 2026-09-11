import { Controller, Post, Body, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { KookService } from './kook.service';

@Controller('kook')
export class KookController {
  private readonly logger = new Logger(KookController.name);

  constructor(private readonly kookService: KookService) {}

  /**
   * Kook Webhook 回调接口
   * 参考文档：https://developer.kookapp.cn/doc/webhook
   */
  @Post('webhook')
  async webhook(@Body() body: any, @Res() res: Response) {
    this.logger.log(`收到Kook webhook: s=${body?.s}, d_type=${body?.d?.type}, channel_type=${body?.d?.channel_type}`);

    // Challenge 验证请求（channel_type = WEBHOOK_CHALLENGE）
    if (body?.d?.channel_type === 'WEBHOOK_CHALLENGE') {
      const { challenge, verify_token: verifyToken } = body.d;

      // 验证 verify_token
      const expectedToken = process.env.KOOK_VERIFY_TOKEN;
      if (expectedToken && verifyToken && verifyToken !== expectedToken) {
        this.logger.warn(`Verify Token不匹配: ${verifyToken} !== ${expectedToken}`);
        return res.status(403).json({ error: 'invalid verify token' });
      }

      this.logger.log(`Kook webhook Challenge验证成功，challenge=${challenge}`);
      // 必须在1秒内原样返回 challenge
      return res.json({ challenge });
    }

    // 正常事件推送（s=0）
    if (body?.s === 0 && body?.d) {
      const event = body.d;
      const extraType = event?.extra?.type;
      const eventType = event?.type;

      // 调试：打印完整事件内容
      this.logger.log(`【Kook完整事件】type=${eventType}, extraType=${extraType}`);
      this.logger.log(`【Kook事件详情】${JSON.stringify(event)?.substring(0, 1000)}`);

      // 验证 verify_token
      const expectedToken = process.env.KOOK_VERIFY_TOKEN;
      if (expectedToken && event?.verify_token && event.verify_token !== expectedToken) {
        this.logger.warn('事件Verify Token不匹配');
        return res.status(403).json({ error: 'invalid verify token' });
      }

      // 按钮点击事件（多种可能的格式）
      const isButtonClick =
        extraType === 'message_btn_click' ||
        eventType === 'message_btn_click' ||
        event?.extra?.body?.value ||
        event?.value;

      if (isButtonClick) {
        const btnBody = event.extra?.body || event.extra || {};
        const kookUserId = btnBody.user_id || event.author_id || event.user_id;
        const value = btnBody.value || event.value;
        const msgId = btnBody.msg_id || event.msg_id;

        this.logger.log(`【按钮点击】用户=${kookUserId}, value=${value}, msgId=${msgId}`);

        if (value && String(value).startsWith('grab:')) {
          const orderId = parseInt(String(value).split(':')[1], 10);
          if (orderId) {
            this.kookService.handleGrabOrder(kookUserId, orderId, msgId).catch(e =>
              this.logger.error('抢单失败', e)
            );
          }
        }
      }

      // 频道消息事件（处理 /绑定 等指令）
      if (eventType === 1 || eventType === 9) {
        this.kookService.handleChannelMessage(event).catch(e =>
          this.logger.error('处理频道消息失败', e)
        );
      }
    }

    // 返回200
    return res.json({ code: 0, message: 'success' });
  }
}
