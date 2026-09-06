import { Controller, Get, Put, Body, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 更新个人资料
  @Put('profile')
  async updateProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.userService.updateProfile(user.id, body);
  }

  // 修改密码
  @Put('password')
  async changePassword(@CurrentUser() user: any, @Body() body: { oldPassword: string; newPassword: string }) {
    return this.userService.changePassword(user.id, body.oldPassword, body.newPassword);
  }

  // 获取我的订单（老板视角）
  @Get('orders/customer')
  async getCustomerOrders(@CurrentUser() user: any, @Query() query: any) {
    return this.userService.getUserOrders(user.id, 'customer', query);
  }

  // 获取我的订单（陪玩视角）
  @Get('orders/provider')
  async getProviderOrders(@CurrentUser() user: any, @Query() query: any) {
    return this.userService.getUserOrders(user.id, 'provider', query);
  }

  // 获取用户公开详情
  @Get(':id')
  async getUserDetail(@Query('id') id: number) {
    return this.userService.getUserDetail(id);
  }
}
