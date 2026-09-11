import { Controller, Post, Body, Logger, Headers, Res } from '@nestjs/common';
import { Response } from 'express';
import { KookService } from './kook.service';

@Controller('kook')
export class KookController {
  private readonly logger = new Logger(KookController.name);

  constructor(private readonly kookService: KookService) {}

  /**
   * Kook Webhook 回调接口
   * 用于接收按钮点击等事件推送
   */
  @Post('webhook')
  async webhook(@Body() body: any, @Headers() headers: any, @Res() res: Response) {
    this.logger.log(`收到Kook webhook: type=${body?.type}, challenge=${body?.challenge ? '有' : '无'}`);

    // 验证 Verify Token（如果配置了）
    const verifyToken = process.env.KOOK_VERIFY_TOKEN;
    if (verifyToken && body?.verify_token && body.verify_token !== verifyToken) {
      this.logger.warn(`Verify Token不匹配`);
      return res.status(403).json({ code: 403, message: 'invalid verify token' });
    }

    // URL验证请求（type=1）- 必须直接返回challenge，不能被拦截器包装
    if (body?.type === 1 && body?.challenge) {
      this.logger.log('Kook webhook URL验证成功');
      return res.json({ challenge: body.challenge });
    }

    // 事件推送（type=0）
    if (body?.type === 0 && body?.d) {
      const event = body.d;
      const extraType = event?.extra?.type;

      this.logger.log(`Kook事件: type=${event?.type}, extraType=${extraType}`);

      // 按钮点击事件
      if (extraType === 'message_btn_click') {
        const bodyData = event.extra.body || {};
        const kookUserId = bodyData.user_id;
        const value = bodyData.value;
        const msgId = bodyData.msg_id;

        this.logger.log(`按钮点击: 用户=${kookUserId}, value=${value}`);

        if (value && String(value).startsWith('grab:')) {
          const orderId = parseInt(String(value).split(':')[1], 10);
          if (orderId) {
            // 异步处理抢单，不阻塞webhook响应
            this.kookService.handleGrabOrder(kookUserId, orderId, msgId).catch(e =>
              this.logger.error('抢单失败', e)
            );
          }
        }
      }

      // 频道消息事件（处理 /绑定 等指令）
      if (event?.type === 1 || event?.type === 9) {
        this.kookService.handleChannelMessage(event).catch(e =>
          this.logger.error('处理频道消息失败', e)
        );
      }
    }

    // Kook要求返回200
    return res.json({ code: 0, message: 'success' });
  }
}
