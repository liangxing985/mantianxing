import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BannerService {
  constructor(private prisma: PrismaService) {}

  // 公开：获取启用的轮播图
  async getPublicList() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // 管理端：列表
  async getAdminList(params: { page: number; pageSize: number; keyword?: string }) {
    const { page, pageSize, keyword } = params;
    const where: any = {};
    if (keyword) {
      where.title = { contains: keyword };
    }
    const [list, total] = await Promise.all([
      this.prisma.banner.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.banner.count({ where }),
    ]);
    return { list, total, page, pageSize };
  }

  // 详情
  async getDetail(id: number) {
    return this.prisma.banner.findUnique({ where: { id } });
  }

  // 创建
  async create(data: any) {
    return this.prisma.banner.create({
      data: {
        title: data.title,
        image: data.image,
        linkUrl: data.linkUrl || null,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  // 更新
  async update(id: number, data: any) {
    return this.prisma.banner.update({
      where: { id },
      data: {
        title: data.title,
        image: data.image,
        linkUrl: data.linkUrl || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });
  }

  // 删除
  async delete(id: number) {
    return this.prisma.banner.delete({ where: { id } });
  }

  // 启用/禁用
  async toggleActive(id: number, isActive: boolean) {
    return this.prisma.banner.update({
      where: { id },
      data: { isActive },
    });
  }
}
