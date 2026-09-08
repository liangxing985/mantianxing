import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // 老板端：获取上架商品列表
  async getPublicList() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
    });
  }

  // 管理端：获取所有商品
  async getAdminList(params: { page?: number; pageSize?: number; keyword?: string; category?: string }) {
    const { page = 1, pageSize = 20, keyword, category } = params;
    const where: any = {};
    if (keyword) where.name = { contains: keyword };
    if (category) where.category = category;
    const [list, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
      }),
      this.prisma.product.count({ where }),
    ]);
    return { list, total, page, pageSize };
  }

  // 详情
  async getDetail(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('商品不存在');
    return product;
  }

  // 创建
  async create(data: any) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description || '',
        price: Number(data.price),
        originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
        gameId: data.gameId ? Number(data.gameId) : null,
        category: data.category || 'normal',
        image: data.image || null,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== false,
      },
    });
  }

  // 更新
  async update(id: number, data: any) {
    await this.getDetail(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price !== undefined ? Number(data.price) : undefined,
        originalPrice: data.originalPrice !== undefined ? (data.originalPrice ? Number(data.originalPrice) : null) : undefined,
        gameId: data.gameId !== undefined ? (data.gameId ? Number(data.gameId) : null) : undefined,
        category: data.category,
        image: data.image,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });
  }

  // 删除
  async delete(id: number) {
    await this.getDetail(id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  // 上下架
  async toggleActive(id: number, isActive: boolean) {
    await this.getDetail(id);
    return this.prisma.product.update({ where: { id }, data: { isActive } });
  }
}
