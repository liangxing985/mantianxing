import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  // 获取所有游戏定价（管理端）
  async getAllPricings() {
    return this.prisma.gamePricing.findMany({
      include: { game: true },
      orderBy: [{ gameId: 'asc' }, { level: 'asc' }],
    });
  }

  // 按游戏获取定价
  async getPricingsByGame(gameId: number) {
    return this.prisma.gamePricing.findMany({
      where: { gameId },
      orderBy: { level: 'asc' },
    });
  }

  // 新增定价
  async createPricing(data: { gameId: number; level: number; pricePerHour: number }) {
    return this.prisma.gamePricing.create({ data });
  }

  // 更新定价
  async updatePricing(id: number, data: { pricePerHour?: number; level?: number }) {
    return this.prisma.gamePricing.update({ where: { id }, data });
  }

  // 删除定价
  async deletePricing(id: number) {
    return this.prisma.gamePricing.delete({ where: { id } });
  }

  // 批量保存定价（按游戏+等级）
  async batchSavePricings(items: { gameId: number; level: number; pricePerHour: number }[]) {
    for (const item of items) {
      const existing = await this.prisma.gamePricing.findUnique({
        where: { gameId_level: { gameId: item.gameId, level: item.level } },
      });
      if (existing) {
        await this.prisma.gamePricing.update({
          where: { id: existing.id },
          data: { pricePerHour: item.pricePerHour },
        });
      } else {
        await this.prisma.gamePricing.create({ data: item });
      }
    }
    return { success: true, count: items.length };
  }

  // 根据陪玩等级获取各游戏价格（陪玩端/老板端用）
  async getPricingsByLevel(level: number) {
    const pricings = await this.prisma.gamePricing.findMany({
      where: { level },
      include: { game: true },
    });
    return pricings.map((p) => ({
      gameId: p.gameId,
      gameName: p.game.name,
      level: p.level,
      pricePerHour: p.pricePerHour,
    }));
  }
}
