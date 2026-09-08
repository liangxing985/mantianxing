import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  // 获取所有游戏定价（管理端）
  async getAllPricings() {
    return this.prisma.gamePricing.findMany({
      include: { game: true },
      orderBy: [{ gameId: 'asc' }, { rank: 'asc' }],
    });
  }

  // 按游戏获取定价
  async getPricingsByGame(gameId: number) {
    return this.prisma.gamePricing.findMany({
      where: { gameId },
      orderBy: { rank: 'asc' },
    });
  }

  // 新增定价
  async createPricing(data: { gameId: number; rank: string; pricePerHour: number }) {
    return this.prisma.gamePricing.create({ data });
  }

  // 更新定价
  async updatePricing(id: number, data: { pricePerHour?: number; rank?: string }) {
    return this.prisma.gamePricing.update({ where: { id }, data });
  }

  // 删除定价
  async deletePricing(id: number) {
    return this.prisma.gamePricing.delete({ where: { id } });
  }

  // 批量保存定价（按游戏+段位）
  async batchSavePricings(items: { gameId: number; rank: string; pricePerHour: number }[]) {
    for (const item of items) {
      const existing = await this.prisma.gamePricing.findUnique({
        where: { gameId_rank: { gameId: item.gameId, rank: item.rank } },
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

  // 根据陪玩段位获取各游戏价格（陪玩端/老板端用）
  async getPricingsByRank(rank: string) {
    const pricings = await this.prisma.gamePricing.findMany({
      where: { rank },
      include: { game: true },
    });
    return pricings.map((p) => ({
      gameId: p.gameId,
      gameName: p.game.name,
      rank: p.rank,
      pricePerHour: p.pricePerHour,
    }));
  }

  // 根据接单量计算等级
  static calculateLevel(orderCount: number): number {
    if (orderCount >= 500) return 10;
    if (orderCount >= 300) return 9;
    if (orderCount >= 200) return 8;
    if (orderCount >= 100) return 7;
    if (orderCount >= 50) return 6;
    if (orderCount >= 30) return 5;
    if (orderCount >= 15) return 4;
    if (orderCount >= 5) return 3;
    if (orderCount >= 1) return 2;
    return 1;
  }
}
