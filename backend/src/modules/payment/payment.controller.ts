import { Controller, Post, Get, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * 管理端：充值统计
   * GET /payment/admin/stats
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @Get('admin/stats')
  async getStats() {
    const result = await this.paymentService.getAdminStats();
    return { code: 0, message: 'success', data: result };
  }

  /**
   * 管理端：所有充值订单列表
   * GET /payment/admin/orders
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @Get('admin/orders')
  async getAllOrders(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('status') status?: string,
  ) {
    const result = await this.paymentService.getAllOrders(Number(page), Number(pageSize), status);
    return { code: 0, message: 'success', data: result };
  }

  /**
   * 创建充值订单
   * POST /payment/recharge
   */
  @UseGuards(JwtAuthGuard)
  @Post('recharge')
  async recharge(@Req() req: any, @Body() body: { amount: number }) {
    const userId = req.user.id;
    const result = await this.paymentService.createRecharge(userId, body.amount, req.user.nickname);
    return { code: 0, message: 'success', data: result };
  }

  /**
   * 查询支付状态（前端轮询）
   * GET /payment/status/:orderId
   */
  @UseGuards(JwtAuthGuard)
  @Get('status/:orderId')
  async queryStatus(@Param('orderId') orderId: string) {
    const result = await this.paymentService.queryStatus(Number(orderId));
    return { code: 0, message: 'success', data: result };
  }

  /**
   * 接收 ShareFlow 支付回调
   * POST /payment/notify
   * 注意：此接口不需要登录，ShareFlow 服务器主动调用
   */
  @Post('notify')
  async notify(@Body() body: any) {
    return this.paymentService.handleNotify(body);
  }

  /**
   * 获取充值记录
   * GET /payment/recharges
   */
  @UseGuards(JwtAuthGuard)
  @Get('recharges')
  async getRecharges(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const userId = req.user.id;
    const result = await this.paymentService.getUserRecharges(userId, Number(page), Number(pageSize));
    return { code: 0, message: 'success', data: result };
  }
}
