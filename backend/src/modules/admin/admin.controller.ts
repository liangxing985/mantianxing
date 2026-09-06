import { Controller, Get, Post, Put, Body, Query, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERATOR')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== 数据概览 ====================
  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  // ==================== 用户管理 ====================
  @Get('users')
  async getUserList(@Query() query: any) {
    return this.adminService.getUserList(query);
  }

  @Put('users/:id/status')
  async toggleUserStatus(@Param('id') id: number, @Body() body: { status: string }) {
    return this.adminService.toggleUserStatus(id, body.status);
  }

  // ==================== 陪玩审核 ====================
  @Get('provider/apply')
  async getProviderApplyList(@Query() query: any) {
    return this.adminService.getProviderApplyList(query);
  }

  @Put('provider/apply/:id')
  async reviewProviderApply(
    @CurrentUser() user: any,
    @Param('id') id: number,
    @Body() body: { status: string; reason?: string },
  ) {
    return this.adminService.reviewProviderApply(user.id, id, body as any);
  }

  // ==================== 订单管理 ====================
  @Get('orders')
  async getOrderList(@Query() query: any) {
    return this.adminService.getOrderList(query);
  }

  // 报单审核列表
  @Get('orders/review')
  async getReviewList(@Query() query: any) {
    return this.adminService.getReviewList(query);
  }

  // 通过报单
  @Put('orders/:id/approve')
  async approveReport(@CurrentUser() user: any, @Param('id') id: number, @Body() body: { comment?: string }) {
    return this.adminService.approveReport(user.id, id, body.comment);
  }

  // 驳回报单
  @Put('orders/:id/reject')
  async rejectReport(@CurrentUser() user: any, @Param('id') id: number, @Body() body: { comment: string }) {
    return this.adminService.rejectReport(user.id, id, body.comment);
  }

  // ==================== 财务管理 ====================
  // 手动充值
  @Post('wallet/recharge')
  async manualRecharge(@CurrentUser() user: any, @Body() body: any) {
    return this.adminService.manualRecharge(user.id, body);
  }

  // 提现审核列表
  @Get('withdraw/list')
  async getWithdrawReviewList(@Query() query: any) {
    return this.adminService.getWithdrawReviewList(query);
  }

  // 审核提现
  @Put('withdraw/:id')
  async reviewWithdraw(@CurrentUser() user: any, @Param('id') id: number, @Body() body: any) {
    return this.adminService.reviewWithdraw(user.id, id, body);
  }

  // ==================== 游戏与服务管理 ====================
  @Post('game')
  async createGame(@Body() body: any) {
    return this.adminService.createGame(body);
  }

  @Put('game/:id')
  async updateGame(@Param('id') id: number, @Body() body: any) {
    return this.adminService.updateGame(id, body);
  }

  @Post('service-item')
  async createServiceItem(@Body() body: any) {
    return this.adminService.createServiceItem(body);
  }

  @Put('service-item/:id')
  async updateServiceItem(@Param('id') id: number, @Body() body: any) {
    return this.adminService.updateServiceItem(id, body);
  }
}
