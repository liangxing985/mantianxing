import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../config/redis.service';
import { getPagination } from '../../common/utils';

@Injectable()
export class ProviderService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // 陪玩列表（支持筛选、搜索、排序）
  async getProviderList(query: any) {
    const { skip, take, page, pageSize } = getPagination(query.page, query.pageSize);
    const where: any = {
      role: 'PROVIDER',
      status: 'ACTIVE',
      providerProfile: {
        applyStatus: 'APPROVED',
      },
    };

    // 按游戏筛选
    if (query.gameId) {
      where.providerProfile.services = {
        some: {
          serviceItem: { gameId: parseInt(query.gameId) },
          isEnabled: true,
        },
      };
    }

    // 按服务项目筛选
    if (query.serviceItemId) {
      where.providerProfile.services = {
        some: {
          serviceItemId: parseInt(query.serviceItemId),
          isEnabled: true,
        },
      };
    }

    // 搜索昵称
    if (query.keyword) {
      where.nickname = { contains: query.keyword };
    }

    // 只看在线
    if (query.online === 'true') {
      where.providerProfile.isOnline = true;
      where.providerProfile.acceptOrder = true;
    }

    // 排序
    let orderBy: any = { providerProfile: { orderCount: 'desc' } };
    if (query.sort === 'rating') {
      orderBy = { providerProfile: { rating: 'desc' } };
    } else if (query.sort === 'price_asc') {
      orderBy = { providerProfile: { services: { _avg: { price: 'asc' } } } };
    }

    const [providers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          nickname: true,
          avatar: true,
          gender: true,
          bio: true,
          providerProfile: {
            select: {
              level: true,
              rating: true,
              ratingCount: true,
              orderCount: true,
              isOnline: true,
              acceptOrder: true,
              services: {
                where: { isEnabled: true },
                include: {
                  serviceItem: { include: { game: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { list: providers, total, page, pageSize };
  }

  // 陪玩详情
  async getProviderDetail(providerId: number) {
    const provider = await this.prisma.user.findUnique({
      where: { id: providerId, role: 'PROVIDER' },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        gender: true,
        bio: true,
        providerProfile: {
          include: {
            services: {
              where: { isEnabled: true },
              include: { serviceItem: { include: { game: true } } },
            },
          },
        },
      },
    });

    if (!provider || !provider.providerProfile) {
      throw new NotFoundException('陪玩不存在');
    }

    return provider;
  }

  // 更新陪玩资料
  async updateProfile(userId: number, data: {
    nickname?: string;
    avatar?: string;
    bio?: string;
    gender?: string;
    voiceCard?: string;
    introVideo?: string;
  }) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('陪玩资料不存在');

    const { nickname, avatar, bio, gender, ...profileData } = data;

    // 更新用户基本信息
    if (nickname || avatar || bio || gender) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { nickname, avatar, bio, gender: gender as any },
      });
    }

    // 更新陪玩资料
    if (Object.keys(profileData).length > 0) {
      await this.prisma.providerProfile.update({
        where: { userId },
        data: profileData,
      });
    }

    return { success: true };
  }

  // 设置服务定价
  async setServicePrice(userId: number, data: {
    serviceItemId: number;
    price: number;
    unit: string;
    description?: string;
    isEnabled?: boolean;
  }) {
    const profile = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('陪玩资料不存在');

    if (data.price <= 0) {
      throw new BadRequestException('价格必须大于0');
    }

    // upsert：存在则更新，不存在则创建
    await this.prisma.providerService.upsert({
      where: {
        providerId_serviceItemId: {
          providerId: profile.id,
          serviceItemId: data.serviceItemId,
        },
      },
      update: {
        price: data.price,
        unit: data.unit,
        description: data.description,
        isEnabled: data.isEnabled ?? true,
      },
      create: {
        providerId: profile.id,
        serviceItemId: data.serviceItemId,
        price: data.price,
        unit: data.unit,
        description: data.description,
        isEnabled: data.isEnabled ?? true,
      },
    });

    return { success: true };
  }

  // 切换在线状态
  async toggleOnline(userId: number, isOnline: boolean) {
    const profile = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('陪玩资料不存在');

    await this.prisma.providerProfile.update({
      where: { userId },
      data: {
        isOnline,
        onlineStatus: isOnline ? 'ONLINE' : 'OFFLINE',
      },
    });

    // 更新Redis在线状态
    const key = `provider:online:${userId}`;
    if (isOnline) {
      await this.redis.set(key, '1', 300); // 5分钟心跳
    } else {
      await this.redis.del(key);
    }

    return { isOnline };
  }

  // 切换接单状态
  async toggleAcceptOrder(userId: number, acceptOrder: boolean) {
    await this.prisma.providerProfile.update({
      where: { userId },
      data: { acceptOrder },
    });
    return { acceptOrder };
  }

  // 获取我的服务列表
  async getMyServices(userId: number) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        services: {
          include: { serviceItem: { include: { game: true } } },
          orderBy: { id: 'asc' },
        },
      },
    });
    return profile?.services || [];
  }
}
