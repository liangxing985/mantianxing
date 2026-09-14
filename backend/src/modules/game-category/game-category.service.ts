import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class GameCategoryService {
  constructor(private prisma: PrismaService) {}

  // 获取所有分类（含游戏）
  async getAll() {
    return this.prisma.gameCategory.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        games: {
          where: { isEnabled: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  // 管理端获取所有分类
  async list() {
    return this.prisma.gameCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { games: true } } },
    });
  }

  // 创建分类
  async create(data: { name: string; icon?: string; sortOrder?: number }) {
    const exists = await this.prisma.gameCategory.findUnique({ where: { name: data.name } });
    if (exists) throw new BadRequestException('分类名称已存在');
    return this.prisma.gameCategory.create({ data });
  }

  // 更新分类
  async update(id: number, data: { name?: string; icon?: string; sortOrder?: number; isEnabled?: boolean }) {
    const category = await this.prisma.gameCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('分类不存在');
    if (data.name && data.name !== category.name) {
      const exists = await this.prisma.gameCategory.findUnique({ where: { name: data.name } });
      if (exists) throw new BadRequestException('分类名称已存在');
    }
    return this.prisma.gameCategory.update({ where: { id }, data });
  }

  // 删除分类
  async delete(id: number) {
    const category = await this.prisma.gameCategory.findUnique({
      where: { id },
      include: { _count: { select: { games: true } } },
    });
    if (!category) throw new NotFoundException('分类不存在');
    if (category._count.games > 0) throw new BadRequestException('该分类下还有游戏，无法删除');
    await this.prisma.gameCategory.delete({ where: { id } });
    return { success: true };
  }
}
