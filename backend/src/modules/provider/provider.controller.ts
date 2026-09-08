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

  // 我的陪玩资料（登录态，注意需定义在 :id 之前）
  @UseGuards(JwtAuthGuard)
  @Get('my-profile')
  async getMyProfile(@CurrentUser() user: any) {
    return this.providerService.getMyProfile(user.id);
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

  // 修改单个服务价格（按服务记录ID）
  @UseGuards(JwtAuthGuard)
  @Put('service/:id/price')
  async updateServicePrice(@CurrentUser() user: any, @Param('id') id: number, @Body() body: { price: number }) {
    return this.providerService.updateServicePrice(user.id, id, body.price);
  }

  // 切换服务启用状态（按服务记录ID）
  @UseGuards(JwtAuthGuard)
  @Put('service/:id/toggle')
  async toggleService(@CurrentUser() user: any, @Param('id') id: number, @Body() body: { isEnabled: boolean }) {
    return this.providerService.toggleService(user.id, id, body.isEnabled);
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
