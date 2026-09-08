import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  // 公开：老板端活动列表
  @Get('public/list')
  async getPublicList() {
    return this.activityService.getPublicList();
  }

  // 管理端：活动列表
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  async getList(@Query() query: any) {
    return this.activityService.getAdminList({
      page: query.page ? Number(query.page) : 1,
      pageSize: query.pageSize ? Number(query.pageSize) : 20,
      keyword: query.keyword,
    });
  }

  // 管理端：活动详情
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  async getDetail(@Param('id') id: number) {
    return this.activityService.getDetail(Number(id));
  }

  // 管理端：创建活动
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() body: any) {
    return this.activityService.create(body);
  }

  // 管理端：更新活动
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: number, @Body() body: any) {
    return this.activityService.update(Number(id), body);
  }

  // 管理端：删除活动
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: number) {
    return this.activityService.delete(Number(id));
  }

  // 管理端：发布/下架
  @Put(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  async toggle(@Param('id') id: number, @Body() body: { isActive: boolean }) {
    return this.activityService.toggleActive(Number(id), body.isActive);
  }
}
