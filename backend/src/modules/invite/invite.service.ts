import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

@Injectable()
export class InviteService {
  private readonly logger = new Logger(InviteService.name);

  constructor(
    private prisma: PrismaService,
    private configService: SystemConfigService,
  ) {}

  // 获取或生成邀请码
  async getMyInviteCode(userId: number) {
    let user = await this.prisma.user.findUnique({ where: { id: userId }, select: { inviteCode: true } });
    if (!user?.inviteCode) {
      let code = generateInviteCode();
      while (await this.prisma.user.findUnique({ where: { inviteCode: code } })) {
        code = generateInviteCode();
      }
      user = await this.prisma.user.update({ where: { id: userId }, data: { inviteCode: code }, select: { inviteCode: true } });
    }
    return { inviteCode: user.inviteCode };
  }

  // 绑定邀请人（注册时调用）
  async bindInviter(inviteeId: number, inviteCode: string) {
    const inviter = await this.prisma.user.findUnique({ where: { inviteCode } });
    if (!inviter) throw new BadRequestException('邀请码无效');
    if (inviter.id === inviteeId) throw new BadRequestException('不能邀请自己');
    const existing = await this.prisma.inviteRecord.findUnique({ where: { inviteeId } });
    if (existing) throw new BadRequestException('已绑定邀请人');
    await this.prisma.inviteRecord.create({ data: { inviterId: inviter.id, inviteeId } });
    await this.prisma.user.update({ where: { id: inviteeId }, data: { inviterId: inviter.id } });
    this.logger.log(`用户${inviteeId}通过邀请码${inviteCode}绑定邀请人${inviter.id}`);
    return { success: true };
  }

  // 获取我的邀请列表
  async getMyInvites(userId: number) {
    const records = await this.prisma.inviteRecord.findMany({
      where: { inviterId: userId },
      include: { invitee: { select: { id: true, nickname: true, avatar: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const totalReward = records.reduce((sum, r) => sum + r.rewardAmount, 0);
    return { totalInvited: records.length, totalReward, records };
  }

  // 下级消费时发放佣金（订单完成时调用）
  async awardCommission(inviteeId: number, orderId: number, orderAmount: number) {
    const record = await this.prisma.inviteRecord.findUnique({ where: { inviteeId } });
    if (!record) return null;
    // 从系统配置读取邀请分销佣金比例（%），默认10%
    const ratePercent = await this.configService.getNumber('invite_commission_rate');
    const rate = (ratePercent || 10) / 100;
    const amount = Math.floor(orderAmount * rate);
    if (amount <= 0) return null;
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: record.inviterId } });
    if (wallet) {
      await this.prisma.wallet.update({
        where: { userId: record.inviterId },
        data: { balance: { increment: amount }, totalIncome: { increment: amount } },
      });
      await this.prisma.walletTransaction.create({
        data: { walletId: wallet.id, userId: record.inviterId, type: 'REWARD', amount, balanceAfter: wallet.balance + amount, orderId, remark: '邀请佣金' },
      });
    }
    await this.prisma.commissionRecord.create({
      data: { userId: record.inviterId, fromUserId: inviteeId, orderId, amount, rate, status: 'SETTLED', settledAt: new Date() },
    });
    await this.prisma.inviteRecord.update({
      where: { id: record.id },
      data: { rewardAmount: { increment: amount }, status: 'REWARDED', rewardedAt: new Date() },
    });
    this.logger.log(`用户${record.inviterId}获得邀请佣金${amount}星石（来自用户${inviteeId}订单${orderId}）`);
    return { amount };
  }

  // 获取佣金记录
  async getMyCommissions(userId: number, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const records = await this.prisma.commissionRecord.findMany({
      where: { userId },
      include: { user: { select: { nickname: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });
    const total = await this.prisma.commissionRecord.aggregate({ where: { userId }, _sum: { amount: true } });
    return { totalAmount: total._sum.amount || 0, records };
  }
}
