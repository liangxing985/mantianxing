import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPagination } from '../../common/utils';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private prisma: PrismaService,
    private configService: SystemConfigService,
  ) {}

  // 获取钱包信息
  async getWallet(userId: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('钱包不存在');

    const coinRate = await this.configService.getNumber('coin_exchange_rate') || 10;

    return {
      balance: wallet.balance,
      frozen: wallet.frozen,
      totalIncome: wallet.totalIncome,
      totalRecharge: wallet.totalRecharge,
      totalWithdraw: wallet.totalWithdraw,
      balanceYuan: wallet.balance / coinRate,
    };
  }

  // 获取流水记录
  async getTransactions(userId: number, query: any) {
    const { skip, take, page, pageSize } = getPagination(query.page, query.pageSize);
    const where: any = { userId };
    if (query.type) {
      // 支持逗号分隔的多个类型，如 "INCOME,WITHDRAW"
      const types = String(query.type).split(',').map((t: string) => t.trim()).filter(Boolean);
      if (types.length > 1) {
        where.type = { in: types };
      } else {
        where.type = types[0];
      }
    }

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
    const amount = Number(data.amount);
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('钱包不存在');

    const minWithdraw = await this.configService.getNumber('min_withdraw') || 100;
    const withdrawFeeRate = await this.configService.getNumber('withdraw_fee_rate') || 5;
    const coinRate = await this.configService.getNumber('coin_exchange_rate') || 10;

    if (amount < minWithdraw) {
      throw new BadRequestException(`最低提现${minWithdraw}星石（${(minWithdraw / coinRate).toFixed(1)}元）`);
    }
    if (wallet.balance < amount) {
      throw new BadRequestException('余额不足');
    }

    // 手续费按配置比例，最低1星石
    const fee = Math.max(1, Math.floor(amount * withdrawFeeRate / 100));
    const realAmount = amount - fee;

    await this.prisma.$transaction(async (tx) => {
      // 冻结提现金额
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: amount },
          frozen: { increment: amount },
        },
      });

      // 创建提现申请
      await tx.withdraw.create({
        data: {
          userId,
          amount: amount,
          fee,
          realAmount: realAmount / coinRate,
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
          amount: -amount,
          balanceAfter: updatedWallet.balance,
          remark: `申请提现${amount}星石，手续费${fee}星石，实际到账${(realAmount / coinRate).toFixed(2)}元`,
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
