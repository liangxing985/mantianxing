/**
 * 订单控制器
 * 提供订单相关的HTTP接口，需登录后访问
 * 老板端：创建订单、取消订单、评价订单
 * 陪玩端：抢单池、抢单、开始服务、提交报单
 * 通用：我的订单、订单详情
 */
import { Controller, Get, Post, Put, Body, Query, Param, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('order')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ==================== 老板端 ====================

  /** 创建订单（支持指定陪玩或抢单池，支持优惠券抵扣） */
  @Post('create')
  async createOrder(@CurrentUser() user: any, @Body() body: any) {
    return this.orderService.createOrder(user.id, body);
  }

  /** 取消订单（仅待支付/待接单/已接单状态，自动退还优惠券） */
  @Put(':id/cancel')
  async cancelOrder(@CurrentUser() user: any, @Param('id') id: number, @Body() body: { reason: string }) {
    return this.orderService.cancelOrder(user.id, id, body.reason);
  }

  /** 评价订单（只能评价一次，更新陪玩评分和等级） */
  @Post(':id/review')
  async reviewOrder(@CurrentUser() user: any, @Param('id') id: number, @Body() body: any) {
    return this.orderService.reviewOrder(user.id, id, body);
  }

  // ==================== 陪玩端 ====================

  /** 抢单池列表（公开，返回待接单且未过期的订单） */
  @Get('pool')
  async getOrderPool(@Query() query: any) {
    return this.orderService.getOrderPool(query);
  }

  /** 我的订单列表（老板/陪玩通用） */
  @Get('my')
  async getMyOrders(@CurrentUser() user: any, @Query() query: any) {
    return this.orderService.getMyOrders(user.id, query);
  }

  /** 抢单（Redis分布式锁，防止并发抢单） */
  @Post(':id/grab')
  async grabOrder(@CurrentUser() user: any, @Param('id') id: number) {
    return this.orderService.grabOrder(user.id, id);
  }

  /** 开始服务（订单状态从已接单改为服务中） */
  @Put(':id/start')
  async startService(@CurrentUser() user: any, @Param('id') id: number) {
    return this.orderService.startService(user.id, id);
  }

  /** 提交报单（陪玩完成服务后提交证据，进入待审核状态） */
  @Post(':id/report')
  async submitReport(@CurrentUser() user: any, @Param('id') id: number, @Body() body: any) {
    // 兼容前端两种字段名：evidences / images
    const evidences = body.evidences || body.images || [];
    return this.orderService.submitReport(user.id, id, evidences);
  }

  // ==================== 通用 ====================

  // 订单详情
  @Get(':id')
  async getOrderDetail(@CurrentUser() user: any, @Param('id') id: number) {
    return this.orderService.getOrderDetail(id, user.id, user.role);
  }
}
