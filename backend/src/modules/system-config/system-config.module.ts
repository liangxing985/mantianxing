import { Module, OnModuleInit } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';

@Module({
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule implements OnModuleInit {
  constructor(private readonly configService: SystemConfigService) {}

  async onModuleInit() {
    await this.configService.initDefaults().catch(() => {});
  }
}
