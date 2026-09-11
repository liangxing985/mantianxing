import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../config/redis.service';
import { KookService } from '../kook/kook.service';
import { generateOrderNo, getPagination } from '../../common/utils';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private kookService: KookService,
  ) {}

  // ==================== 老板端 ====================

  // 创建订单
  async createOrder(customerId: number, data: {
    serviceItemId: number;
    gameId: number;
    title: string;
    requirement?: string;
    duration: number;
    providerId?: number; // 指定陪玩则直接派单
    contactType?: string;
    contactValue?: string;
    gameAccount?: string;
    overridePrice?: number; // 商品下单时覆盖单价
    productName?: string; // 商品名称（备注用）
  }) {
    // 获取服务项目信息（商品模式下serviceItemId可能为0，自动查找该游戏第一个启用的服务项目）
    let serviceItem = null;
    if (data.serviceItemId && data.serviceItemId > 0) {
      serviceItem = await this.prisma.serviceItem.findUnique({
        where: { id: data.serviceItemId },
        include: { game: true },
      });
    }
    if (!serviceItem && data.gameId) {
      serviceItem = await this.prisma.serviceItem.findFirst({
        where: { gameId: data.gameId, isEnabled: true },
        include: { game: true },
        orderBy: { id: 'asc' },
      });
    }
    if (!serviceItem || !serviceItem.isEnabled) {
      throw new BadRequestException('服务项目不存在或已下架');
    }

    // 如果指定陪玩
    let unitPrice = serviceItem.defaultPrice;
    if (data.providerId) {
      // 前端传的是 User.id，需先转为 ProviderProfile.id
      const providerProfile = await this.prisma.providerProfile.findUnique({
        where: { userId: data.providerId },
      });
      if (!providerProfile) {
        throw new BadRequestException('该陪玩不存在或未入驻');
      }
      if (providerProfile.applyStatus !== 'APPROVED') {
        throw new BadRequestException('该陪玩资质未通过审核');
      }
      if (!providerProfile.acceptOrder) {
        throw new BadRequestException('该陪玩暂不接单');
      }

      // 如果传了overridePrice（陪玩详情页/商品下单），直接使用覆盖价格，不检查providerService
      if (data.overridePrice && data.overridePrice > 0) {
        unitPrice = data.overridePrice;
      } else {
        // 旧模式：检查陪玩是否开通该服务项目
        const providerService = await this.prisma.providerService.findFirst({
          where: {
            providerId: providerProfile.id,
            serviceItemId: serviceItem.id,
            isEnabled: true,
          },
        });
        if (!providerService) {
          throw new BadRequestException('该陪玩未开通此服务');
        }
        unitPrice = providerService.price;
      }
    } else {
      // 未指定陪玩（抢单池），如果有overridePrice则覆盖
      if (data.overridePrice && data.overridePrice > 0) {
        unitPrice = data.overridePrice;
      }
    }

    const totalAmount = unitPrice * data.duration;

    // 检查老板余额
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: customerId } });
    if (!wallet || wallet.balance < totalAmount) {
      throw new BadRequestException('星石余额不足，请先充值');
    }

    // 创建订单（事务：扣余额+冻结+创建订单）
    const order = await this.prisma.$transaction(async (tx) => {
      // 扣减余额，冻结金额
      await tx.wallet.update({
        where: { userId: customerId },
        data: {
          balance: { decrement: totalAmount },
          frozen: { increment: totalAmount },
        },
      });

      // 记录流水
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: customerId,
          type: 'FROZEN',
          amount: -totalAmount,
          balanceAfter: wallet.balance - totalAmount,
          remark: `下单冻结：${data.title}`,
        },
      });

      // 创建订单
      const order = await tx.order.create({
        data: {
          orderNo: generateOrderNo(),
          customerId,
          providerId: data.providerId || null,
          gameId: data.gameId ?? serviceItem.gameId,
          serviceItemId: serviceItem.id,
          title: data.title || serviceItem.name,
          requirement: data.requirement,
          duration: data.duration,
          unitPrice,
          totalAmount,
          status: 'PAID', // 所有订单都先进入待接单状态，陪玩确认后才变为已接单
          contactType: data.contactType,
          contactValue: data.contactValue,
          gameAccount: data.gameAccount,
          paidAt: new Date(),
          acceptedAt: null, // 陪玩确认接单后才设置
          expireAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时过期
        },
        include: {
          serviceItem: { include: { game: true } },
          customer: { select: { id: true, nickname: true, avatar: true } },
          provider: { select: { id: true, nickname: true, avatar: true } },
        },
      });

      return order;
    });

    this.logger.log(`订单创建成功: ${order.orderNo}, 金额: ${order.totalAmount}星石`);

    // 如果进入抢单池（未指定陪玩），异步推送到 Kook 抢单频道
    if (order.status === 'PAID') {
      this.kookService.sendOrderCard(order).catch((e) =>
        this.logger.error('Kook 推送失败', e),
      );
    }

    return order;
  }

  // 取消订单（老板）
  async cancelOrder(customerId: number, orderId: number, reason: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.customerId !== customerId) throw new ForbiddenException('无权操作此订单');

    // 只有待支付、待接单、已接单状态可以取消
    if (order.status === 'SERVING') {
      throw new BadRequestException('服务进行中，请联系客服协商取消');
    }
    if (!['CREATED', 'PAID', 'ASSIGNED'].includes(order.status)) {
      throw new BadRequestException('当前订单状态不可取消');
    }

    await this.prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      });

      // 解冻金额，退回余额
      await tx.wallet.update({
        where: { userId: customerId },
        data: {
          balance: { increment: order.totalAmount },
          frozen: { decrement: order.totalAmount },
        },
      });

      // 记录流水
      const wallet = await tx.wallet.findUnique({ where: { userId: customerId } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: customerId,
          type: 'UNFROZEN',
          amount: order.totalAmount,
          balanceAfter: wallet.balance,
          orderId,
          remark: `订单取消退款：${order.orderNo}`,
        },
      });
    });

    this.logger.log(`订单已取消: ${order.orderNo}`);
    return { success: true };
  }

  // ==================== 陪玩端 ====================

  // 抢单池列表
  async getOrderPool(query: any) {
    const { skip, take, page, pageSize } = getPagination(query.page, query.pageSize);
    const where: any = {
      status: 'PAID', // 待接单
      expireAt: { gt: new Date() }, // 未过期
      providerId: null, // 抢单池只显示未指定陪玩的订单
    };

    if (query.gameId) {
      where.gameId = parseInt(query.gameId);
    }
    if (query.serviceItemId) {
      where.serviceItemId = parseInt(query.serviceItemId);
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          serviceItem: { include: { game: true } },
          customer: { select: { id: true, nickname: true, avatar: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { list: orders, total, page, pageSize };
  }

  // 抢单（Redis分布式锁防超抢）
  async grabOrder(providerId: number, orderId: number) {
    // 检查陪玩状态
    const profile = await this.prisma.providerProfile.findUnique({ where: { userId: providerId } });
    if (!profile || profile.applyStatus !== 'APPROVED') {
      throw new BadRequestException('陪玩资质未通过审核');
    }
    if (!profile.acceptOrder) {
      throw new BadRequestException('您已关闭接单');
    }

    // Redis分布式锁
    const lockKey = `order:grab:${orderId}`;
    const lockValue = uuidv4();
    const locked = await this.redis.lock(lockKey, lockValue, 10); // 10秒锁

    if (!locked) {
      throw new BadRequestException('手慢了，订单已被其他人抢走');
    }

    try {
      // 二次检查订单状态
      const order = await this.prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('订单不存在');
      if (order.status !== 'PAID') {
        throw new BadRequestException('订单已被接单或已取消');
      }
      if (order.expireAt && order.expireAt < new Date()) {
        throw new BadRequestException('订单已过期');
      }
      // 如果订单指定了陪玩，只有指定陪玩才能接单
      if (order.providerId && order.providerId !== providerId) {
        throw new BadRequestException('该订单已指定其他陪玩');
      }

      // 更新订单状态为已接单
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          providerId,
          status: 'ASSIGNED',
          acceptedAt: new Date(),
        },
      });

      // 获取陪玩昵称，异步更新 Kook 卡片状态
      const provider = await this.prisma.user.findUnique({
        where: { id: providerId },
        select: { nickname: true },
      });
      const fullOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { serviceItem: { include: { game: true } } },
      });
      if (provider && fullOrder) {
        this.kookService.updateOrderCard(fullOrder, provider.nickname).catch((e) =>
          this.logger.error('Kook 卡片更新失败', e),
        );
      }

      this.logger.log(`陪玩${providerId}抢单成功: ${order.orderNo}`);
      return { success: true, orderId };
    } finally {
      // 释放锁
      await this.redis.unlock(lockKey, lockValue);
    }
  }

  // 开始服务
  async startService(providerId: number, orderId: number) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.providerId !== providerId) throw new ForbiddenException('无权操作此订单');
    if (order.status !== 'ASSIGNED') {
      throw new BadRequestException('当前状态不可开始服务');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SERVING',
        startedAt: new Date(),
      },
    });

    return { success: true };
  }

  // 提交报单（上传截图凭证）
  async submitReport(providerId: number, orderId: number, evidences: Array<{
    type: string;
    imageUrl: string;
    description?: string;
  }>) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.providerId !== providerId) throw new ForbiddenException('无权操作此订单');
    if (order.status !== 'SERVING') {
      throw new BadRequestException('当前状态不可提交报单');
    }

    if (!evidences || evidences.length === 0) {
      throw new BadRequestException('请至少上传一张服务凭证截图');
    }

    await this.prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'REVIEWING',
          submittedAt: new Date(),
          reviewStatus: 'PENDING',
        },
      });

      // 创建凭证记录（兼容：字符串数组=base64图片 / 对象数组={type,imageUrl,description}）
      await tx.orderEvidence.createMany({
        data: evidences.map((e: any) => ({
          orderId,
          type: typeof e === 'string' ? 'RESULT' : (e.type as any) || 'RESULT',
          imageUrl: typeof e === 'string' ? e : e.imageUrl,
          description: typeof e === 'string' ? undefined : e.description,
        })),
      });
    });

    return { success: true };
  }

  // ==================== 通用 ====================

  // 我的订单列表（老板端：作为顾客；陪玩端：作为接单者）
  async getMyOrders(userId: number, query: any) {
    const { skip, take, page, pageSize } = getPagination(query.page, query.pageSize);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const where: any =
      user?.role === 'PROVIDER' ? { providerId: userId } : { customerId: userId };
    if (query.status) {
      if (query.status.includes(',')) {
        where.status = { in: query.status.split(',') };
      } else {
        where.status = query.status;
      }
    }

    const [list, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          serviceItem: { include: { game: true } },
          customer: { select: { id: true, nickname: true, avatar: true } },
          provider: { select: { id: true, nickname: true, avatar: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  // 订单详情
  async getOrderDetail(orderId: number, userId: number, role?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        serviceItem: { include: { game: true } },
        customer: { select: { id: true, nickname: true, avatar: true, phone: true } },
        provider: { select: { id: true, nickname: true, avatar: true, phone: true } },
        evidences: true,
      },
    });

    if (!order) throw new NotFoundException('订单不存在');

    // 权限检查：管理员/客服可查看所有订单，其他用户只能查看自己的订单
    if (role !== 'ADMIN' && role !== 'OPERATOR' && order.customerId !== userId && order.providerId !== userId) {
      throw new ForbiddenException('无权查看此订单');
    }

    return order;
  }

  // 订单评价
  async reviewOrder(customerId: number, orderId: number, data: {
    rating: number;
    content?: string;
    tags?: string;
    isAnonymous?: boolean;
  }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.customerId !== customerId) throw new ForbiddenException('无权评价此订单');
    if (order.status !== 'COMPLETED') {
      throw new BadRequestException('订单未完成，无法评价');
    }
    if (order.customerRating) {
      throw new BadRequestException('订单已评价');
    }

    await this.prisma.$transaction(async (tx) => {
      // 更新订单评价
      await tx.order.update({
        where: { id: orderId },
        data: {
          customerRating: data.rating,
          customerComment: data.content,
        },
      });

      // 创建评价记录
      await tx.review.create({
        data: {
          orderId,
          customerId,
          providerId: order.providerId!,
          rating: data.rating,
          content: data.content,
          tags: data.tags,
          isAnonymous: data.isAnonymous || false,
        },
      });

      // 更新陪玩评分
      const profile = await tx.providerProfile.findUnique({ where: { userId: order.providerId! } });
      if (profile) {
        const newRatingCount = profile.ratingCount + 1;
        const newRating = (profile.rating * profile.ratingCount + data.rating) / newRatingCount;
        await tx.providerProfile.update({
          where: { userId: order.providerId! },
          data: {
            rating: Math.round(newRating * 10) / 10,
            ratingCount: newRatingCount,
          },
        });
      }
    });

    return { success: true };
  }
}
