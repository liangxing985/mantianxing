import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  constructor(private prisma: PrismaService) {}

  // 获取会员等级列表
  async getLevels() {
    return this.prisma.membershipLevel.findMany({ where: { isEnabled: true }, orderBy: { level: 'asc' } });
  }

  // 获取用户会员信息
  async getMyMembership(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { membershipLevel: true, membershipExpireAt: true },
    });
    const isActive = user?.membershipExpireAt && user.membershipExpireAt > new Date();
    return {
      level: user?.membershipLevel || 0,
      expireAt: user?.membershipExpireAt,
      isActive: !!isActive,
    };
  }

  // 购买会员
  async purchase(userId: number, level: number, months: number) {
    const lv = await this.prisma.membershipLevel.findUnique({ where: { level } });
    if (!lv || !lv.isEnabled) throw new BadRequestException('会员等级不存在');
    const totalCost = lv.price * months;
    const wallet = await this.prisma.wallet.findUnique({ where: { userId }, include: { user: true } });
    if (!wallet || wallet.balance < totalCost) throw new BadRequestException('星石余额不足');

    const now = new Date();
    const currentExpire = wallet.user?.membershipExpireAt && wallet.user.membershipExpireAt > now ? wallet.user.membershipExpireAt : now;
    const newExpire = new Date(currentExpire.getTime() + months * 30 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      // 扣款
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: totalCost } },
      });
      // 更新用户会员
      await tx.user.update({
        where: { id: userId },
        data: { membershipLevel: level, membershipExpireAt: newExpire },
      });
      // 记录
      await tx.membershipRecord.create({
        data: { userId, level, months, amount: totalCost, endTime: newExpire },
      });
      // 流水
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'CONSUME',
          amount: -totalCost,
          balanceAfter: wallet.balance - totalCost,
          remark: `购买${lv.name}会员${months}个月`,
        },
      });
      return { success: true, newExpire };
    });
    this.logger.log(`用户${userId}购买${lv.name}会员${months}个月，花费${totalCost}星石`);
    return result;
  }

  // 管理端：CRUD会员等级
  async createLevel(data: any) {
    return this.prisma.membershipLevel.create({ data });
  }

  async updateLevel(id: number, data: any) {
    return this.prisma.membershipLevel.update({ where: { id }, data });
  }

  async deleteLevel(id: number) {
    return this.prisma.membershipLevel.delete({ where: { id } });
  }
}
