import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  // 获取所有游戏类目（含服务项目）
  async getGameList() {
    return this.prisma.game.findMany({
      where: { isEnabled: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        serviceItems: {
          where: { isEnabled: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  // 获取游戏详情
  async getGameDetail(gameId: number) {
    return this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        serviceItems: {
          where: { isEnabled: true },
        },
      },
    });
  }

  // 获取服务项目详情
  async getServiceItemDetail(serviceItemId: number) {
    return this.prisma.serviceItem.findUnique({
      where: { id: serviceItemId },
      include: { game: true },
    });
  }
}
