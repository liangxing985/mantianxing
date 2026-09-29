import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class GameRankService {
  constructor(private prisma: PrismaService) {}

  // 获取某游戏的段位列表
  async getByGame(gameId: number) {
    return this.prisma.gameRank.findMany({
      where: { gameId },
      orderBy: [{ sortOrder: 'asc' }, { level: 'asc' }],
    });
  }

  // 获取所有段位（管理端）
  async list(gameId?: number) {
    const where: any = {};
    if (gameId) where.gameId = gameId;
    return this.prisma.gameRank.findMany({
      where,
      include: { game: { select: { id: true, name: true } } },
      orderBy: [{ gameId: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  // 创建段位
  async create(data: { gameId: number; name: string; level?: number; sortOrder?: number }) {
    const game = await this.prisma.game.findUnique({ where: { id: data.gameId } });
    if (!game) throw new NotFoundException('游戏不存在');

    const existing = await this.prisma.gameRank.findFirst({
      where: { gameId: data.gameId, name: data.name },
    });
    if (existing) throw new BadRequestException('该游戏下已存在同名段位');

    return this.prisma.gameRank.create({
      data: {
        gameId: data.gameId,
        name: data.name,
        level: data.level || 1,
        sortOrder: data.sortOrder || 0,
      },
    });
  }

  // 更新段位
  async update(id: number, data: { name?: string; level?: number; sortOrder?: number }) {
    const rank = await this.prisma.gameRank.findUnique({ where: { id } });
    if (!rank) throw new NotFoundException('段位不存在');

    if (data.name) {
      const existing = await this.prisma.gameRank.findFirst({
        where: { gameId: rank.gameId, name: data.name, NOT: { id } },
      });
      if (existing) throw new BadRequestException('该游戏下已存在同名段位');
    }

    return this.prisma.gameRank.update({
      where: { id },
      data,
    });
  }

  // 删除段位
  async delete(id: number) {
    const rank = await this.prisma.gameRank.findUnique({ where: { id } });
    if (!rank) throw new NotFoundException('段位不存在');
    await this.prisma.gameRank.delete({ where: { id } });
    return { success: true };
  }
}
