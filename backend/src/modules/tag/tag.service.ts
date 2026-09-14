import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  // 获取标签列表
  async getTags(category?: string) {
    const where: any = { isEnabled: true };
    if (category) where.category = category;
    return this.prisma.skillTag.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }

  // 获取用户标签
  async getUserTags(userId: number) {
    const userTags = await this.prisma.userSkillTag.findMany({
      where: { userId },
      include: { tag: true },
    });
    return userTags.map(ut => ut.tag);
  }

  // 设置用户标签（陪玩自己设置，最多5个）
  async setUserTags(userId: number, tagIds: number[]) {
    if (tagIds.length > 5) throw new BadRequestException('最多设置5个标签');
    // 验证标签都存在且启用
    const tags = await this.prisma.skillTag.findMany({ where: { id: { in: tagIds }, isEnabled: true } });
    if (tags.length !== tagIds.length) throw new BadRequestException('存在无效标签');
    await this.prisma.$transaction(async (tx) => {
      await tx.userSkillTag.deleteMany({ where: { userId } });
      await tx.userSkillTag.createMany({
        data: tagIds.map(tagId => ({ userId, tagId })),
      });
    });
    return this.getUserTags(userId);
  }

  // 设置声音标签（单个）
  async setVoiceTag(userId: number, voiceTag: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { voiceTag } });
    return { voiceTag };
  }

  // 管理端CRUD
  async createTag(data: any) {
    return this.prisma.skillTag.create({ data });
  }

  async updateTag(id: number, data: any) {
    return this.prisma.skillTag.update({ where: { id }, data });
  }

  async deleteTag(id: number) {
    return this.prisma.skillTag.delete({ where: { id } });
  }
}
