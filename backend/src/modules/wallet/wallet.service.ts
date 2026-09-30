/**
 * 钱包服务模块
 * 负责用户星石钱包管理：余额查询、冻结/解冻、提现申请、流水记录
 * 星石为平台虚拟货币，1元=10星石（可配置）
 * 提现手续费比例可后台配置，无最低手续费限制
 */
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPagination } from '../../common/utils';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private prisma: PrismaService,           // 数据库ORM
    private configService: SystemConfigService, // 系统配置
  ) {}

  /**
   * 获取钱包信息
   * 返回余额、冻结金额、累计收入/充值/提现，以及换算后的人民币金额
   */
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
  /** 获取钱包流水记录（支持类型筛选和分页） */
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
  /**
   * 申请提现
   * 校验最低提现金额和余额，事务内：冻结提现金额 → 创建提现记录 → 记录流水
   * 手续费按配置比例计算，无最低手续费限制
   */
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

    // 手续费按配置比例计算（向下取整）
    const fee = Math.floor(amount * withdrawFeeRate / 100);
    const realAmount = amount - fee;

    await this.prisma.$transaction(async (tx) => {
      // 用update的where条件实现乐观锁：只有余额>=amount时才扣减
      // 防止并发提现导致余额变负
      const walletUpdate = await tx.wallet.update({
        where: { userId, balance: { gte: amount } },
        data: {
          balance: { decrement: amount },
          frozen: { increment: amount },
        },
      }).catch(() => {
        throw new BadRequestException('余额不足');
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
      await tx.walletTransaction.create({
        data: {
          walletId: walletUpdate.id,
          userId,
          type: 'WITHDRAW',
          amount: -amount,
          balanceAfter: walletUpdate.balance,
          remark: `申请提现${amount}星石，手续费${fee}星石，实际到账${(realAmount / coinRate).toFixed(2)}元`,
        },
      });
    });

    this.logger.log(`用户${userId}申请提现${data.amount}星石`);
    return { success: true };
  }

  // 提现记录
  /** 获取用户提现记录列表（支持状态筛选和分页） */
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
