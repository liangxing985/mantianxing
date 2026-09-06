import { Controller, Get, Post, Put, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  // 陪玩列表（公开）
  @Get('list')
  async getProviderList(@Query() query: any) {
    return this.providerService.getProviderList(query);
  }

  // 陪玩详情（公开）
  @Get(':id')
  async getProviderDetail(@Param('id') id: number) {
    return this.providerService.getProviderDetail(id);
  }

  // 更新陪玩资料
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.providerService.updateProfile(user.id, body);
  }

  // 设置服务定价
  @UseGuards(JwtAuthGuard)
  @Post('service')
  async setServicePrice(@CurrentUser() user: any, @Body() body: any) {
    return this.providerService.setServicePrice(user.id, body);
  }

  // 获取我的服务列表
  @UseGuards(JwtAuthGuard)
  @Get('my/services')
  async getMyServices(@CurrentUser() user: any) {
    return this.providerService.getMyServices(user.id);
  }

  // 切换在线状态
  @UseGuards(JwtAuthGuard)
  @Put('online')
  async toggleOnline(@CurrentUser() user: any, @Body() body: { isOnline: boolean }) {
    return this.providerService.toggleOnline(user.id, body.isOnline);
  }

  // 切换接单状态
  @UseGuards(JwtAuthGuard)
  @Put('accept-order')
  async toggleAcceptOrder(@CurrentUser() user: any, @Body() body: { acceptOrder: boolean }) {
    return this.providerService.toggleAcceptOrder(user.id, body.acceptOrder);
  }
}
