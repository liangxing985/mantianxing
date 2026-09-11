import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPagination } from '../../common/utils';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private configService: SystemConfigService,
  ) {}

  // 根据接单量计算等级
  private calculateLevel(orderCount: number): number {
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

  // ==================== 数据概览 ====================
  async getDashboard() {
    const [
      totalUsers,
      totalProviders,
      totalOrders,
      todayOrders,
      totalRevenue,
      platformRevenue,
      pendingReviews,
      pendingWithdraws,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.count({ where: { role: 'PROVIDER' } }),
      this.prisma.order.count(),
      this.prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'CONSUME' },
      }),
      this.prisma.order.aggregate({
        _sum: { platformFee: true },
        where: { status: 'COMPLETED' },
      }),
      this.prisma.order.count({ where: { status: 'REVIEWING' } }),
      this.prisma.withdraw.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalUsers,
      totalProviders,
      totalOrders,
      todayOrders,
      totalRevenue: Math.abs(totalRevenue._sum.amount || 0),
      platformRevenue: platformRevenue._sum.platformFee || 0,
      pendingReviews,
      pendingWithdraws,
    };
  }

  // ==================== 用户管理 ====================
  async getUserList(query: any) {
    const { skip, take, page, pageSize } = getPagination(query.page, query.pageSize);
    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.keyword) {
      where.OR = [
        { username: { contains: query.keyword } },
        { nickname: { contains: query.keyword } },
        { phone: { contains: query.keyword } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          phone: true,
          role: true,
          status: true,
          isVerified: true,
          createdAt: true,
          lastLoginAt: true,
          wallet: { select: { balance: true, frozen: true } },
          providerProfile: { select: { level: true, rating: true, applyStatus: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { list: users, total, page, pageSize };
  }

  // 禁用/启用用户
  async toggleUserStatus(userId: number, status: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
    });
    return { success: true };
  }

  // ==================== 陪玩审核 ====================
  async getProviderApplyList(query: any) {
    const { skip, take, page, pageSize } = getPagination(query.page, query.pageSize);
    const where: any = {};
    if (query.applyStatus) where.applyStatus = query.applyStatus;

    const [profiles, total] = await Promise.all([
      this.prisma.providerProfile.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, nickname: true, avatar: true, phone: true } },
        },
      }),
      this.prisma.providerProfile.count({ where }),
    ]);

    return { list: profiles, total, page, pageSize };
  }

  // 审核陪玩入驻
  async reviewProviderApply(adminId: number, profileId: number, data: {
    status: 'APPROVED' | 'REJECTED';
    reason?: string;
  }) {
    const profile = await this.prisma.providerProfile.findUnique({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('申请不存在');

    await this.prisma.providerProfile.update({
      where: { id: profileId },
      data: {
        applyStatus: data.status,
        rejectReason: data.reason,
      },
    });

    // 发送消息通知
    await this.prisma.message.create({
      data: {
        userId: profile.userId,
        type: 'SYSTEM',
        title: data.status === 'APPROVED' ? '入驻审核通过' : '入驻审核被拒绝',
        content: data.status === 'APPROVED'
          ? '恭喜您，陪玩入驻申请已通过审核，可以开始接单了！'
          : `很抱歉，您的入驻申请未通过，原因：${data.reason || '不符合要求'}`,
      },
    });

    return { success: true };
  }

  // ==================== 订单管理 ====================
  async getOrderList(query: any) {
    const { skip, take, page, pageSize } = getPagination(query.page, query.pageSize);
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.orderNo) where.orderNo = { contains: query.orderNo };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          serviceItem: { include: { game: true } },
          customer: { select: { id: true, nickname: true, phone: true } },
          provider: { select: { id: true, nickname: true, phone: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { list: orders, total, page, pageSize };
  }

  // 报单审核列表
  async getReviewList(query: any) {
    const { skip, take, page, pageSize } = getPagination(query.page, query.pageSize);
    const where = { status: 'REVIEWING' as const };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { submittedAt: 'asc' },
        include: {
          serviceItem: { include: { game: true } },
          customer: { select: { id: true, nickname: true, phone: true } },
          provider: { select: { id: true, nickname: true, phone: true } },
          evidences: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { list: orders, total, page, pageSize };
  }

  // 审核报单（通过 -> 结算）
  async approveReport(adminId: number, orderId: number, comment?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 'REVIEWING') {
      throw new BadRequestException('订单状态不正确');
    }

    // 平台抽成从系统配置读取
    const feeRate = await this.configService.getNumber('platform_fee_rate') || 20;
    const platformFee = Math.floor(order.totalAmount * feeRate / 100);
    const providerIncome = order.totalAmount - platformFee;

    await this.prisma.$transaction(async (tx) => {
      // 更新订单
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          reviewStatus: 'APPROVED',
          reviewerId: adminId,
          reviewComment: comment,
          reviewedAt: new Date(),
          completedAt: new Date(),
          platformFee,
          providerIncome,
        },
      });

      // 解冻老板冻结金额（已在下单时扣除，这里直接结算给陪玩）
      // 陪玩钱包增加收入
      const providerWallet = await tx.wallet.findUnique({ where: { userId: order.providerId! } });
      await tx.wallet.update({
        where: { userId: order.providerId! },
        data: {
          balance: { increment: providerIncome },
          totalIncome: { increment: providerIncome },
        },
      });

      // 陪玩流水
      await tx.walletTransaction.create({
        data: {
          walletId: providerWallet.id,
          userId: order.providerId!,
          type: 'INCOME',
          amount: providerIncome,
          balanceAfter: providerWallet.balance + providerIncome,
          orderId,
          remark: `订单收入：${order.orderNo}`,
        },
      });

      // 更新陪玩订单数和等级（根据接单量自动升级）
      const updatedProfile = await tx.providerProfile.update({
        where: { userId: order.providerId! },
        data: { orderCount: { increment: 1 } },
      });
      // 根据接单量计算等级
      const newLevel = this.calculateLevel(updatedProfile.orderCount);
      if (newLevel !== updatedProfile.level) {
        await tx.providerProfile.update({
          where: { userId: order.providerId! },
          data: { level: newLevel },
        });
      }

      // 老板流水：将下单时的FROZEN流水转为CONSUME（避免重复扣款）
      const frozenTx = await tx.walletTransaction.findFirst({
        where: { orderId, type: 'FROZEN', userId: order.customerId },
      });
      if (frozenTx) {
        await tx.walletTransaction.update({
          where: { id: frozenTx.id },
          data: { type: 'CONSUME', remark: `订单消费：${order.orderNo}` },
        });
      }

      // 解冻老板冻结
      await tx.wallet.update({
        where: { userId: order.customerId },
        data: { frozen: { decrement: order.totalAmount } },
      });
    });

    this.logger.log(`订单${order.orderNo}审核通过，陪玩收入${providerIncome}星石`);
    return { success: true };
  }

  // 驳回报单（回到服务中）
  async rejectReport(adminId: number, orderId: number, comment: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SERVING',
        reviewStatus: 'REJECTED',
        reviewerId: adminId,
        reviewComment: comment,
        reviewedAt: new Date(),
      },
    });

    return { success: true };
  }

  // ==================== 财务管理 ====================

  // 手动充值（后台给老板加星石）
  async manualRecharge(adminId: number, data: {
    userId: number;
    amount: number; // 星石
    remark?: string;
  }) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: data.userId } });
    if (!wallet) throw new NotFoundException('用户钱包不存在');

    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: data.userId },
        data: {
          balance: { increment: data.amount },
          totalRecharge: { increment: data.amount },
        },
      });

      const updated = await tx.wallet.findUnique({ where: { userId: data.userId } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: data.userId,
          type: 'RECHARGE',
          amount: data.amount,
          balanceAfter: updated.balance,
          remark: data.remark || `后台手动充值${data.amount}星石`,
          operatorId: adminId,
        },
      });
    });

    this.logger.log(`管理员${adminId}给用户${data.userId}充值${data.amount}星石`);
    return { success: true };
  }

  // 提现审核列表
  async getWithdrawReviewList(query: any) {
    const { skip, take, page, pageSize } = getPagination(query.page, query.pageSize);
    const where: any = {};
    if (query.status) where.status = query.status;

    const [withdraws, total] = await Promise.all([
      this.prisma.withdraw.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, nickname: true, phone: true } },
        },
      }),
      this.prisma.withdraw.count({ where }),
    ]);

    return { list: withdraws, total, page, pageSize };
  }

  // 审核提现
  async reviewWithdraw(adminId: number, withdrawId: number, data: {
    status: 'APPROVED' | 'REJECTED';
    comment?: string;
  }) {
    const withdraw = await this.prisma.withdraw.findUnique({ where: { id: withdrawId } });
    if (!withdraw) throw new NotFoundException('提现申请不存在');
    if (withdraw.status !== 'PENDING') {
      throw new BadRequestException('提现申请已处理');
    }

    await this.prisma.$transaction(async (tx) => {
      if (data.status === 'APPROVED') {
        // 通过：扣冻结，标记已打款
        await tx.withdraw.update({
          where: { id: withdrawId },
          data: {
            status: 'PAID',
            reviewerId: adminId,
            reviewComment: data.comment,
            paidAt: new Date(),
          },
        });

        await tx.wallet.update({
          where: { userId: withdraw.userId },
          data: {
            frozen: { decrement: withdraw.amount },
            totalWithdraw: { increment: withdraw.amount },
          },
        });
      } else {
        // 拒绝：退回余额
        await tx.withdraw.update({
          where: { id: withdrawId },
          data: {
            status: 'REJECTED',
            reviewerId: adminId,
            reviewComment: data.comment,
          },
        });

        await tx.wallet.update({
          where: { userId: withdraw.userId },
          data: {
            balance: { increment: withdraw.amount },
            frozen: { decrement: withdraw.amount },
          },
        });

        const wallet = await tx.wallet.findUnique({ where: { userId: withdraw.userId } });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: withdraw.userId,
            type: 'REFUND',
            amount: withdraw.amount,
            balanceAfter: wallet.balance,
            remark: `提现被拒退回：${data.comment || ''}`,
          },
        });
      }
    });

    return { success: true };
  }

  // ==================== 游戏与服务管理 ====================
  async createGame(data: { name: string; icon?: string; sortOrder?: number }) {
    return this.prisma.game.create({ data });
  }

  async updateGame(gameId: number, data: any) {
    return this.prisma.game.update({ where: { id: gameId }, data });
  }

  async createServiceItem(data: {
    gameId: number;
    name: string;
    description?: string;
    defaultPrice?: number;
    unit?: string;
    sortOrder?: number;
  }) {
    const { gameId, ...rest } = data;
    return this.prisma.serviceItem.create({
      data: {
        ...rest,
        game: { connect: { id: gameId } },
      },
    });
  }

  async updateServiceItem(itemId: number, data: any) {
    const { gameId, ...rest } = data;
    const updateData: any = { ...rest };
    if (gameId) {
      updateData.game = { connect: { id: gameId } };
    }
    return this.prisma.serviceItem.update({ where: { id: itemId }, data: updateData });
  }

  async deleteGame(gameId: number) {
    return this.prisma.game.delete({ where: { id: gameId } });
  }

  async deleteServiceItem(itemId: number) {
    return this.prisma.serviceItem.delete({ where: { id: itemId } });
  }
}
