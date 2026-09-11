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
      if (process.env.KOOK_USE_WEBSOCKET === 'true') {
        // WebSocket 模式
        await this.kookService.connect();
      } else {
        // Webhook 模式：只初始化HTTP客户端，不建立WebSocket连接
        await this.kookService.initHttpClient();
      }
    } else {
      this.logger.warn('未配置 KOOK_BOT_TOKEN，Kook 机器人未启动');
    }
  }
}
