import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SystemConfigService } from './system-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  // 公开接口：获取老板端主题配置
  @Get('public/theme')
  async getPublicTheme() {
    const theme = await this.configService.getJSON('client_theme');
    const feeRate = await this.configService.getNumber('platform_fee_rate');
    const coinRate = await this.configService.getNumber('coin_exchange_rate');
    return { theme, platformFeeRate: feeRate, coinExchangeRate: coinRate };
  }

  // 管理端：获取所有配置
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  async getAll() {
    return this.configService.getAll();
  }

  // 管理端：批量更新配置
  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Body() body: { items: Array<{ key: string; value: string }> }) {
    return this.configService.updateMany(body.items || []);
  }
}
