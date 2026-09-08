import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  // 老板端：获取进行中的活动
  async getPublicList() {
    const now = new Date();
    return this.prisma.activity.findMany({
      where: {
        isActive: true,
        OR: [
          { startTime: null },
          { startTime: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endTime: null },
              { endTime: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
    });
  }

  // 管理端：获取所有活动
  async getAdminList(params: { page?: number; pageSize?: number; keyword?: string }) {
    const { page = 1, pageSize = 20, keyword } = params;
    const where: any = {};
    if (keyword) where.title = { contains: keyword };
    const [list, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
      }),
      this.prisma.activity.count({ where }),
    ]);
    return { list, total, page, pageSize };
  }

  // 详情
  async getDetail(id: number) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('活动不存在');
    return activity;
  }

  // 创建
  async create(data: any) {
    return this.prisma.activity.create({
      data: {
        title: data.title,
        content: data.content || '',
        image: data.image || null,
        linkUrl: data.linkUrl || null,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== false,
      },
    });
  }

  // 更新
  async update(id: number, data: any) {
    await this.getDetail(id);
    return this.prisma.activity.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        image: data.image,
        linkUrl: data.linkUrl,
        startTime: data.startTime !== undefined ? (data.startTime ? new Date(data.startTime) : null) : undefined,
        endTime: data.endTime !== undefined ? (data.endTime ? new Date(data.endTime) : null) : undefined,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });
  }

  // 删除
  async delete(id: number) {
    await this.getDetail(id);
    await this.prisma.activity.delete({ where: { id } });
    return { success: true };
  }

  // 发布/下架
  async toggleActive(id: number, isActive: boolean) {
    await this.getDetail(id);
    return this.prisma.activity.update({ where: { id }, data: { isActive } });
  }
}
