import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  // 获取可领取的优惠券列表
  async getAvailableCoupons(userId: number) {
    const now = new Date();
    const coupons = await this.prisma.coupon.findMany({
      where: {
        isEnabled: true,
        AND: [
          {
            OR: [
              { startTime: null },
              { startTime: { lte: now } },
            ],
          },
          {
            OR: [
              { endTime: null },
              { endTime: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // 查询用户已领取数量
    const userCoupons = await this.prisma.userCoupon.groupBy({
      by: ['couponId'],
      where: { userId },
      _count: { id: true },
    });
    const claimedMap = new Map(userCoupons.map((u) => [u.couponId, u._count.id]));

    // 查询每张券已领取总数（用于判断是否领完）
    const allClaimed = await this.prisma.userCoupon.groupBy({
      by: ['couponId'],
      _count: { id: true },
    });
    const totalClaimedMap = new Map(allClaimed.map((u) => [u.couponId, u._count.id]));

    return coupons.map((c) => ({
      ...c,
      claimed: claimedMap.get(c.id) || 0,
      canClaim:
        (c.totalCount === 0 || (totalClaimedMap.get(c.id) || 0) < c.totalCount) &&
        (claimedMap.get(c.id) || 0) < c.perUserLimit,
    }));
  }

  // 获取我的优惠券
  async getMyCoupons(userId: number, status?: string) {
    const where: any = { userId };
    if (status) where.status = status;
    return this.prisma.userCoupon.findMany({
      where,
      include: { coupon: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 领取优惠券（事务防超领）
  async claimCoupon(userId: number, couponId: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('优惠券不存在');
    if (!coupon.isEnabled) throw new BadRequestException('优惠券已下架');

    const now = new Date();
    if (coupon.startTime && coupon.startTime > now) throw new BadRequestException('优惠券未开始');
    if (coupon.endTime && coupon.endTime < now) throw new BadRequestException('优惠券已过期');

    // 事务：检查总领取量 + 用户领取量 + 创建记录
    const userCoupon = await this.prisma.$transaction(async (tx) => {
      // 检查总领取量
      const totalClaimed = await tx.userCoupon.count({ where: { couponId } });
      if (coupon.totalCount > 0 && totalClaimed >= coupon.totalCount) {
        throw new BadRequestException('优惠券已领完');
      }

      // 检查用户领取量
      const userClaimed = await tx.userCoupon.count({ where: { userId, couponId } });
      if (userClaimed >= coupon.perUserLimit) {
        throw new BadRequestException('已达领取上限');
      }

      // 创建领取记录
      return tx.userCoupon.create({
        data: {
          userId,
          couponId,
          expireAt: coupon.endTime,
        },
        include: { coupon: true },
      });
    });

    return userCoupon;
  }

  // 计算优惠金额
  calculateDiscount(coupon: any, orderAmount: number): number {
    if (orderAmount < coupon.minAmount) return 0;
    if (coupon.type === 'FIXED') {
      return Math.min(coupon.discountValue, orderAmount);
    } else if (coupon.type === 'DISCOUNT') {
      return Math.floor(orderAmount * (1 - coupon.discountValue / 100));
    }
    return 0;
  }

  // 使用优惠券（下单时调用，事务防重复使用）
  async useCoupon(userId: number, userCouponId: number, orderId: number, orderAmount: number) {
    const result = await this.prisma.$transaction(async (tx) => {
      const userCoupon = await tx.userCoupon.findUnique({
        where: { id: userCouponId },
        include: { coupon: true },
      });
      if (!userCoupon) throw new NotFoundException('优惠券不存在');
      if (userCoupon.userId !== userId) throw new ForbiddenException('无权使用此优惠券');
      if (userCoupon.status !== 'UNUSED') throw new BadRequestException('优惠券状态不可用');

      const now = new Date();
      if (userCoupon.expireAt && userCoupon.expireAt < now) throw new BadRequestException('优惠券已过期');

      const discount = this.calculateDiscount(userCoupon.coupon, orderAmount);
      if (discount <= 0) throw new BadRequestException('未达到最低使用金额');

      // 更新优惠券状态
      await tx.userCoupon.update({
        where: { id: userCouponId },
        data: { status: 'USED', orderId, usedAt: now },
      });

      // 更新券已使用数量
      await tx.coupon.update({
        where: { id: userCoupon.couponId },
        data: { usedCount: { increment: 1 } },
      });

      return { discount, userCoupon };
    });

    return result;
  }

  // 退还优惠券（订单取消时）
  async refundCoupon(userCouponId: number) {
    const userCoupon = await this.prisma.userCoupon.findUnique({ where: { id: userCouponId } });
    if (!userCoupon || userCoupon.status !== 'USED') return;
    await this.prisma.userCoupon.update({
      where: { id: userCouponId },
      data: { status: 'UNUSED', orderId: null, usedAt: null },
    });
    await this.prisma.coupon.update({
      where: { id: userCoupon.couponId },
      data: { usedCount: { decrement: 1 } },
    });
  }

  // ==================== 管理端 ====================
  async list() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { userCoupons: true } } },
    });
  }

  async create(data: any) {
    return this.prisma.coupon.create({ data });
  }

  async update(id: number, data: any) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('优惠券不存在');
    return this.prisma.coupon.update({ where: { id }, data });
  }

  async delete(id: number) {
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }
}
