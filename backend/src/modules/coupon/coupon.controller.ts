import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('coupons')
export class CouponController {
  constructor(private readonly service: CouponService) {}

  // 获取可领取的优惠券
  @Get('available')
  async getAvailable(@CurrentUser() user: any) {
    return this.service.getAvailableCoupons(user?.id || 0);
  }

  // 获取我的优惠券
  @Get('my')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER', 'PROVIDER')
  async getMy(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.service.getMyCoupons(user.id, status);
  }

  // 领取优惠券
  @Post(':id/claim')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER', 'PROVIDER')
  async claim(@CurrentUser() user: any, @Param('id') id: number) {
    return this.service.claimCoupon(user.id, id);
  }

  // ==================== 管理端 ====================
  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async list() {
    return this.service.list();
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async update(@Param('id') id: number, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: number) {
    return this.service.delete(id);
  }
}
