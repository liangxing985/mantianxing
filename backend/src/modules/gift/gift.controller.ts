import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { GiftService } from './gift.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('gift')
export class GiftController {
  constructor(private readonly giftService: GiftService) {}

  @Get('list')
  async getGifts() {
    return this.giftService.getGifts();
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendGift(
    @CurrentUser() user: any,
    @Body() body: { receiverId: number; giftId: number; quantity?: number; message?: string; orderId?: number },
  ) {
    return this.giftService.sendGift(user.id, body.receiverId, body.giftId, body.quantity || 1, body.message, body.orderId);
  }

  @Get('received')
  @UseGuards(JwtAuthGuard)
  async getReceived(@CurrentUser() user: any, @Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    return this.giftService.getReceivedGifts(user.id, Number(page), Number(pageSize));
  }

  @Get('sent')
  @UseGuards(JwtAuthGuard)
  async getSent(@CurrentUser() user: any, @Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    return this.giftService.getSentGifts(user.id, Number(page), Number(pageSize));
  }

  // 管理端
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createGift(@Body() body: any) {
    return this.giftService.createGift(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateGift(@Param('id') id: string, @Body() body: any) {
    return this.giftService.updateGift(Number(id), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteGift(@Param('id') id: string) {
    return this.giftService.deleteGift(Number(id));
  }
}
