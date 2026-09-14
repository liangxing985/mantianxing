import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RankService {
  constructor(private prisma: PrismaService) {}

  // 陪玩收入排行榜
  async getIncomeRank(limit = 20) {
    return this.prisma.providerProfile.findMany({
      where: { applyStatus: 'APPROVED' },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { totalIncome: 'desc' },
      take: limit,
    });
  }

  // 陪玩接单量排行榜
  async getOrderRank(limit = 20) {
    return this.prisma.providerProfile.findMany({
      where: { applyStatus: 'APPROVED' },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { orderCount: 'desc' },
      take: limit,
    });
  }

  // 陪玩评分排行榜
  async getRatingRank(limit = 20) {
    return this.prisma.providerProfile.findMany({
      where: { applyStatus: 'APPROVED', ratingCount: { gte: 3 } },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: [{ rating: 'desc' }, { ratingCount: 'desc' }],
      take: limit,
    });
  }

  // 老板消费排行榜
  async getConsumerRank(limit = 20) {
    const users = await this.prisma.user.findMany({
      where: { role: 'CUSTOMER', status: 'ACTIVE' },
      include: { wallet: true },
      orderBy: { wallet: { totalRecharge: 'desc' } },
      take: limit,
    });
    return users.map(u => ({
      id: u.id,
      nickname: u.nickname,
      avatar: u.avatar,
      totalRecharge: u.wallet?.totalRecharge || 0,
    }));
  }

  // 礼物收礼排行榜
  async getGiftRank(limit = 20) {
    return this.prisma.user.findMany({
      where: { role: 'PROVIDER', status: 'ACTIVE' },
      select: { id: true, nickname: true, avatar: true, totalGiftsReceived: true },
      orderBy: { totalGiftsReceived: 'desc' },
      take: limit,
    });
  }

  // 获取我的排名
  async getMyRank(userId: number, type: 'income' | 'order' | 'rating') {
    const profile = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return { rank: -1, value: 0 };
    let count = 0;
    if (type === 'income') {
      count = await this.prisma.providerProfile.count({
        where: { applyStatus: 'APPROVED', totalIncome: { gt: profile.totalIncome } },
      });
      return { rank: count + 1, value: profile.totalIncome };
    }
    if (type === 'order') {
      count = await this.prisma.providerProfile.count({
        where: { applyStatus: 'APPROVED', orderCount: { gt: profile.orderCount } },
      });
      return { rank: count + 1, value: profile.orderCount };
    }
    count = await this.prisma.providerProfile.count({
      where: { applyStatus: 'APPROVED', ratingCount: { gte: 3 }, rating: { gt: profile.rating } },
    });
    return { rank: count + 1, value: profile.rating };
  }
}
