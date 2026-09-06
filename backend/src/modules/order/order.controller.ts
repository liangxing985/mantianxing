import { Controller, Get, Post, Put, Body, Query, Param, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('order')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ==================== 老板端 ====================

  // 创建订单
  @Post('create')
  async createOrder(@CurrentUser() user: any, @Body() body: any) {
    return this.orderService.createOrder(user.id, body);
  }

  // 取消订单
  @Put(':id/cancel')
  async cancelOrder(@CurrentUser() user: any, @Param('id') id: number, @Body() body: { reason: string }) {
    return this.orderService.cancelOrder(user.id, id, body.reason);
  }

  // 评价订单
  @Post(':id/review')
  async reviewOrder(@CurrentUser() user: any, @Param('id') id: number, @Body() body: any) {
    return this.orderService.reviewOrder(user.id, id, body);
  }

  // ==================== 陪玩端 ====================

  // 抢单池列表
  @Get('pool')
  async getOrderPool(@Query() query: any) {
    return this.orderService.getOrderPool(query);
  }

  // 抢单
  @Post(':id/grab')
  async grabOrder(@CurrentUser() user: any, @Param('id') id: number) {
    return this.orderService.grabOrder(user.id, id);
  }

  // 开始服务
  @Put(':id/start')
  async startService(@CurrentUser() user: any, @Param('id') id: number) {
    return this.orderService.startService(user.id, id);
  }

  // 提交报单
  @Post(':id/report')
  async submitReport(@CurrentUser() user: any, @Param('id') id: number, @Body() body: { evidences: any[] }) {
    return this.orderService.submitReport(user.id, id, body.evidences);
  }

  // ==================== 通用 ====================

  // 订单详情
  @Get(':id')
  async getOrderDetail(@CurrentUser() user: any, @Param('id') id: number) {
    return this.orderService.getOrderDetail(id, user.id);
  }
}
