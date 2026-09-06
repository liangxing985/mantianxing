import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPagination, coinToYuan } from '../../common/utils';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {}

  // 获取钱包信息
  async getWallet(userId: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('钱包不存在');

    return {
      balance: wallet.balance,
      frozen: wallet.frozen,
      totalIncome: wallet.totalIncome,
      totalRecharge: wallet.totalRecharge,
      totalWithdraw: wallet.totalWithdraw,
      balanceYuan: coinToYuan(wallet.balance),
    };
  }

  // 获取流水记录
  async getTransactions(userId: number, query: any) {
    const { skip, take, page, pageSize } = getPagination(query.page, query.pageSize);
    const where: any = { userId };
    if (query.type) where.type = query.type;

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return { list: transactions, total, page, pageSize };
  }

  // 申请提现
  async applyWithdraw(userId: number, data: {
    amount: number;
    payMethod: string;
    payAccount: string;
    payName: string;
  }) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('钱包不存在');

    if (data.amount < 100) {
      throw new BadRequestException('最低提现100星石（10元）');
    }
    if (wallet.balance < data.amount) {
      throw new BadRequestException('余额不足');
    }

    // 手续费5%，最低1星石
    const fee = Math.max(1, Math.floor(data.amount * 0.05));
    const realAmount = data.amount - fee;

    await this.prisma.$transaction(async (tx) => {
      // 冻结提现金额
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: data.amount },
          frozen: { increment: data.amount },
        },
      });

      // 创建提现申请
      await tx.withdraw.create({
        data: {
          userId,
          amount: data.amount,
          fee,
          realAmount: coinToYuan(realAmount),
          payMethod: data.payMethod,
          payAccount: data.payAccount,
          payName: data.payName,
          status: 'PENDING',
        },
      });

      // 流水
      const updatedWallet = await tx.wallet.findUnique({ where: { userId } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'WITHDRAW',
          amount: -data.amount,
          balanceAfter: updatedWallet.balance,
          remark: `申请提现${data.amount}星石`,
        },
      });
    });

    this.logger.log(`用户${userId}申请提现${data.amount}星石`);
    return { success: true };
  }

  // 提现记录
  async getWithdrawList(userId: number, query: any) {
    const { skip, take, page, pageSize } = getPagination(query.page, query.pageSize);
    const where: any = { userId };
    if (query.status) where.status = query.status;

    const [withdraws, total] = await Promise.all([
      this.prisma.withdraw.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.withdraw.count({ where }),
    ]);

    return { list: withdraws, total, page, pageSize };
  }
}
