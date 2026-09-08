import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ProviderService } from './provider.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  // 陪玩列表（公开）
  @Get('list')
  async getProviderList(@Query() query: any) {
    return this.providerService.getProviderList(query);
  }

  // 管理端：陪玩列表（注意需定义在 :id 之前）
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @Get('admin/list')
  async getAdminList(@Query() query: any) {
    return this.providerService.getAdminList(query);
  }

  // 我的陪玩资料（登录态，注意需定义在 :id 之前）
  @UseGuards(JwtAuthGuard)
  @Get('my-profile')
  async getMyProfile(@CurrentUser() user: any) {
    return this.providerService.getMyProfile(user.id);
  }

  // 获取我的服务列表（登录态，注意需定义在 :id 之前）
  @UseGuards(JwtAuthGuard)
  @Get('my/services')
  async getMyServices(@CurrentUser() user: any) {
    return this.providerService.getMyServices(user.id);
  }

  // 管理端：编辑陪玩资料（注意需定义在 :id 之前）
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('admin/:id')
  async adminUpdate(@Param('id') id: number, @Body() body: any) {
    return this.providerService.adminUpdate(Number(id), body);
  }

  // 管理端：设置陪玩段位（注意需定义在 :id 之前）
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @Put('admin/:id/rank')
  async updateRank(@Param('id') id: number, @Body() body: { rank: string }) {
    return this.providerService.updateRank(Number(id), body.rank);
  }

  // 管理端：拉黑/解封（注意需定义在 :id 之前）
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('admin/:id/ban')
  async adminBan(@Param('id') id: number, @Body() body: { banned: boolean }) {
    return this.providerService.adminBan(Number(id), body.banned);
  }

  // 管理端：删除陪玩（注意需定义在 :id 之前）
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/:id')
  async adminDelete(@Param('id') id: number) {
    return this.providerService.adminDelete(Number(id));
  }

  // 获取我的游戏列表（登录态，注意需定义在 :id 之前）
  @UseGuards(JwtAuthGuard)
  @Get('my/games')
  async getMyGames(@CurrentUser() user: any) {
    return this.providerService.getProviderGames(user.id);
  }

  // 设置我的游戏（登录态，注意需定义在 :id 之前）
  @UseGuards(JwtAuthGuard)
  @Put('my/games')
  async setMyGames(@CurrentUser() user: any, @Body() body: { gameIds: number[] }) {
    return this.providerService.setProviderGames(user.id, body.gameIds || []);
  }

  // 管理端：获取陪玩游戏（注意需定义在 :id 之前）
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @Get('admin/:id/games')
  async getAdminGames(@Param('id') id: number) {
    return this.providerService.getProviderGamesByProfileId(Number(id));
  }

  // 管理端：设置陪玩游戏（注意需定义在 :id 之前）
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @Put('admin/:id/games')
  async setAdminGames(@Param('id') id: number, @Body() body: { gameIds: number[] }) {
    return this.providerService.setProviderGamesByProfileId(Number(id), body.gameIds || []);
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
