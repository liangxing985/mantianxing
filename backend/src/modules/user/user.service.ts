import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPagination } from '../../common/utils';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // 更新个人资料
  async updateProfile(userId: number, data: {
    nickname?: string;
    avatar?: string;
    bio?: string;
    gender?: 'MALE' | 'FEMALE' | 'UNKNOWN';
    phone?: string;
  }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        gender: true,
        phone: true,
      },
    });
    return user;
  }

  // 修改密码
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const bcrypt = await import('bcryptjs');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) throw new Error('原密码错误');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return { success: true };
  }

  // 获取用户详情（公开信息）
  async getUserDetail(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        providerProfile: {
          include: {
            services: {
              include: { serviceItem: { include: { game: true } } },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('用户不存在');

    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
      bio: user.bio,
      role: user.role,
      providerProfile: user.providerProfile,
    };
  }

  // 获取用户订单列表
  async getUserOrders(userId: number, role: 'customer' | 'provider', query: any) {
    const { skip, take, page, pageSize } = getPagination(query.page, query.pageSize);
    const where = role === 'customer' ? { customerId: userId } : { providerId: userId };
    if (query.status) where['status'] = query.status;

    const [orders, total] = await Promise.all([
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

    return { list: orders, total, page, pageSize };
  }
}
