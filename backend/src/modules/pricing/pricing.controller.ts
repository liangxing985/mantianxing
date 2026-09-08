import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  // 管理端：获取所有定价
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @Get('list')
  async getAll() {
    return this.pricingService.getAllPricings();
  }

  // 管理端：按游戏获取定价
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @Get('game/:gameId')
  async getByGame(@Param('gameId') gameId: number) {
    return this.pricingService.getPricingsByGame(Number(gameId));
  }

  // 管理端：批量保存定价
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @Post('batch')
  async batchSave(@Body() body: { items: { gameId: number; rank: string; pricePerHour: number }[] }) {
    return this.pricingService.batchSavePricings(body.items || []);
  }

  // 管理端：新增定价
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() body: { gameId: number; rank: string; pricePerHour: number }) {
    return this.pricingService.createPricing(body);
  }

  // 管理端：更新定价
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  async update(@Param('id') id: number, @Body() body: { pricePerHour?: number; rank?: string }) {
    return this.pricingService.updatePricing(Number(id), body);
  }

  // 管理端：删除定价
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: number) {
    return this.pricingService.deletePricing(Number(id));
  }

  // 公开：根据段位获取各游戏价格（陪玩端/老板端用）
  @Get('public/rank/:rank')
  async getByRank(@Param('rank') rank: string) {
    return this.pricingService.getPricingsByRank(rank);
  }
}
