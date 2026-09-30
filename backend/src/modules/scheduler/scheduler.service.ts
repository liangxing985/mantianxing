/**
 * 定时任务模块
 * 负责系统定时任务：订单过期自动取消退款、数据统计等
 * 使用setInterval实现，无需额外依赖
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private orderExpireTimer: NodeJS.Timeout | null = null;

  constructor(private prisma: PrismaService) {}

  /** 模块启动时初始化定时任务 */
  onModuleInit() {
    this.startOrderExpireCheck();
    this.logger.log('✅ 定时任务模块已启动');
  }

  /**
   * 订单过期检查（每5分钟执行一次）
   * 查找状态为PAID（待接单）且已过期的订单，自动取消并退款
   * 退款逻辑：解冻金额退回老板余额，退还优惠券
   */
  private startOrderExpireCheck() {
    // 每5分钟检查一次
    this.orderExpireTimer = setInterval(() => {
      this.processExpiredOrders().catch((e) => {
        this.logger.error('订单过期处理失败', e);
      });
    }, 5 * 60 * 1000);

    this.logger.log('⏰ 订单过期检查定时任务已启动（每5分钟）');
  }

  /**
   * 处理过期订单
   * 查找PAID状态且expireAt < now的订单，逐个取消退款
   */
  private async processExpiredOrders() {
    const now = new Date();
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: 'PAID',
        expireAt: { lt: now },
      },
      take: 50, // 每次最多处理50单，防止长时间阻塞
    });

    if (expiredOrders.length === 0) return;

    this.logger.log(`发现 ${expiredOrders.length} 个过期订单，开始自动取消退款`);

    for (const order of expiredOrders) {
      try {
        await this.cancelExpiredOrder(order.id, order.customerId, order.totalAmount, order.couponId);
        this.logger.log(`订单 ${order.orderNo} 已过期自动取消并退款`);
      } catch (e: any) {
        this.logger.error(`订单 ${order.orderNo} 过期取消失败: ${e.message}`);
      }
    }
  }

  /**
   * 取消过期订单并退款（事务保证一致性）
   * @param orderId 订单ID
   * @param customerId 老板用户ID
   * @param amount 退款金额
   * @param couponId 优惠券ID（如有）
   */
  private async cancelExpiredOrder(
    orderId: number,
    customerId: number,
    amount: number,
    couponId: number | null,
  ) {
    await this.prisma.$transaction(async (tx) => {
      // 更新订单状态为已取消
      await tx.order.update({
        where: { id: orderId, status: 'PAID' },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: '订单超时未接单，系统自动取消',
        },
      }).catch(() => {
        throw new Error('订单状态已变更');
      });

      // 退还优惠券
      if (couponId) {
        const userCoupon = await tx.userCoupon.findFirst({
          where: { id: couponId, userId: customerId, status: 'USED' },
        });
        if (userCoupon) {
          await tx.userCoupon.update({
            where: { id: userCoupon.id },
            data: { status: 'UNUSED', orderId: null, usedAt: null },
          });
          await tx.coupon.update({
            where: { id: userCoupon.couponId },
            data: { usedCount: { decrement: 1 } },
          });
        }
      }

      // 解冻金额退回余额（用where条件检查frozen是否足够）
      const walletUpdate = await tx.wallet.update({
        where: { userId: customerId, frozen: { gte: amount } },
        data: {
          balance: { increment: amount },
          frozen: { decrement: amount },
        },
      }).catch(() => {
        throw new Error('冻结金额不足');
      });

      // 记录流水
      await tx.walletTransaction.create({
        data: {
          walletId: walletUpdate.id,
          userId: customerId,
          type: 'UNFROZEN',
          amount,
          balanceAfter: walletUpdate.balance,
          orderId,
          remark: '订单超时自动取消退款',
        },
      });
    });
  }
}
