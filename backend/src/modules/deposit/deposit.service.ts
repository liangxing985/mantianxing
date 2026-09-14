import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DepositService {
  private readonly logger = new Logger(DepositService.name);

  constructor(private prisma: PrismaService) {}

  // 获取我的保证金
  async getMyDeposit(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { depositBalance: true },
    });
    const records = await this.prisma.depositRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return { balance: user?.depositBalance || 0, records };
  }

  // 缴纳保证金
  async payDeposit(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('金额必须大于0');
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < amount) throw new BadRequestException('星石余额不足');

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } });
      const user = await tx.user.update({
        where: { id: userId },
        data: { depositBalance: { increment: amount } },
      });
      await tx.depositRecord.create({
        data: { userId, type: 'DEPOSIT', amount, balanceAfter: user.depositBalance, remark: '缴纳保证金' },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'CONSUME',
          amount: -amount,
          balanceAfter: wallet.balance - amount,
          remark: '缴纳保证金',
        },
      });
      return { success: true, balance: user.depositBalance };
    });
    this.logger.log(`用户${userId}缴纳保证金${amount}星石`);
    return result;
  }

  // 申请退还保证金
  async refundDeposit(userId: number, amount: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.depositBalance < amount) throw new BadRequestException('保证金余额不足');
    // 检查是否有进行中订单
    const activeOrders = await this.prisma.order.count({
      where: { providerId: userId, status: { in: ['PAID', 'ASSIGNED', 'SERVING', 'REVIEWING'] } },
    });
    if (activeOrders > 0) throw new BadRequestException('有进行中订单，暂不能退还保证金');

    const result = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { depositBalance: { decrement: amount } },
      });
      await tx.wallet.update({ where: { userId }, data: { balance: { increment: amount } } });
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      await tx.depositRecord.create({
        data: { userId, type: 'REFUND', amount, balanceAfter: u.depositBalance, remark: '退还保证金' },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet!.id,
          userId,
          type: 'INCOME',
          amount,
          balanceAfter: wallet!.balance,
          remark: '保证金退还',
        },
      });
      return { success: true, balance: u.depositBalance };
    });
    this.logger.log(`用户${userId}退还保证金${amount}星石`);
    return result;
  }

  // 管理端：扣除保证金（违规处罚）
  async deductDeposit(userId: number, amount: number, remark: string, operatorId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.depositBalance < amount) throw new BadRequestException('保证金余额不足');
    const u = await this.prisma.user.update({
      where: { id: userId },
      data: { depositBalance: { decrement: amount } },
    });
    await this.prisma.depositRecord.create({
      data: { userId, type: 'DEDUCT', amount, balanceAfter: u.depositBalance, remark, operatorId },
    });
    this.logger.log(`管理员${operatorId}扣除用户${userId}保证金${amount}星石：${remark}`);
    return { success: true, balance: u.depositBalance };
  }
}
