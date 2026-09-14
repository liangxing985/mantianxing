import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class GiftService {
  private readonly logger = new Logger(GiftService.name);

  constructor(
    private prisma: PrismaService,
    private configService: SystemConfigService,
  ) {}

  // 获取礼物列表
  async getGifts() {
    return this.prisma.gift.findMany({ where: { isEnabled: true }, orderBy: { sortOrder: 'asc' } });
  }

  // 打赏礼物
  async sendGift(senderId: number, receiverId: number, giftId: number, quantity = 1, message?: string, orderId?: number) {
    if (senderId === receiverId) throw new BadRequestException('不能给自己打赏');
    const gift = await this.prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift || !gift.isEnabled) throw new BadRequestException('礼物不存在');
    const totalAmount = gift.price * quantity;
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: senderId } });
    if (!wallet || wallet.balance < totalAmount) throw new BadRequestException('星石余额不足');

    // 从系统配置读取礼物打赏平台抽成比例（%），默认20%
    const feeRatePercent = await this.configService.getNumber('gift_platform_fee_rate');
    const feeRate = (feeRatePercent || 20) / 100;

    const result = await this.prisma.$transaction(async (tx) => {
      // 扣款
      await tx.wallet.update({ where: { userId: senderId }, data: { balance: { decrement: totalAmount } } });
      // 收款方收入（平台抽成）
      const platformFee = Math.floor(totalAmount * feeRate);
      const receiverIncome = totalAmount - platformFee;
      const receiverWallet = await tx.wallet.findUnique({ where: { userId: receiverId } });
      if (receiverWallet) {
        await tx.wallet.update({
          where: { userId: receiverId },
          data: { balance: { increment: receiverIncome }, totalIncome: { increment: receiverIncome } },
        });
      }
      // 更新收礼总值
      await tx.user.update({ where: { id: receiverId }, data: { totalGiftsReceived: { increment: totalAmount } } });
      // 记录
      const record = await tx.giftRecord.create({
        data: { senderId, receiverId, giftId, quantity, totalAmount, orderId, message },
        include: { gift: true, sender: { select: { id: true, nickname: true, avatar: true } } },
      });
      // 流水
      await tx.walletTransaction.create({
        data: { walletId: wallet.id, userId: senderId, type: 'GIFT', amount: -totalAmount, balanceAfter: wallet.balance - totalAmount, orderId, remark: `打赏${gift.name}x${quantity}` },
      });
      if (receiverWallet) {
        await tx.walletTransaction.create({
          data: { walletId: receiverWallet.id, userId: receiverId, type: 'GIFT', amount: receiverIncome, balanceAfter: receiverWallet.balance + receiverIncome, orderId, remark: `收到${gift.name}x${quantity}` },
        });
      }
      return record;
    });
    this.logger.log(`用户${senderId}打赏用户${receiverId} ${gift.name}x${quantity}，价值${totalAmount}星石`);
    return result;
  }

  // 获取我的收礼记录
  async getReceivedGifts(userId: number, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    return this.prisma.giftRecord.findMany({
      where: { receiverId: userId },
      include: { gift: true, sender: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });
  }

  // 获取我的送礼记录
  async getSentGifts(userId: number, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    return this.prisma.giftRecord.findMany({
      where: { senderId: userId },
      include: { gift: true, receiver: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });
  }

  // 管理端CRUD
  async createGift(data: any) {
    return this.prisma.gift.create({ data });
  }

  async updateGift(id: number, data: any) {
    return this.prisma.gift.update({ where: { id }, data });
  }

  async deleteGift(id: number) {
    return this.prisma.gift.delete({ where: { id } });
  }
}
