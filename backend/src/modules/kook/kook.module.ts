import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { KookService } from './kook.service';
import { KookController } from './kook.controller';

@Module({
  controllers: [KookController],
  providers: [KookService],
  exports: [KookService],
})
export class KookModule implements OnModuleInit {
  private readonly logger = new Logger(KookModule.name);

  constructor(private readonly kookService: KookService) {}

  async onModuleInit() {
    // 仅在配置了 Token 时启动机器人
    if (process.env.KOOK_BOT_TOKEN) {
      // Webhook 模式下不需要启动 WebSocket 连接
      if (process.env.KOOK_USE_WEBSOCKET === 'true') {
        await this.kookService.connect();
      } else {
        this.logger.log('Kook 机器人使用 Webhook 模式，不启动 WebSocket 连接');
      }
    } else {
      this.logger.warn('未配置 KOOK_BOT_TOKEN，Kook 机器人未启动');
    }
  }
}
