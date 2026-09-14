import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { BannerService } from './banner.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('banner')
export class BannerController {
  constructor(private readonly service: BannerService) {}

  // 公开：老板端轮播图列表
  @Get('public/list')
  async getPublicList() {
    return this.service.getPublicList();
  }

  // 管理端：列表
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  async getList(@Query() query: any) {
    return this.service.getAdminList({
      page: query.page ? Number(query.page) : 1,
      pageSize: query.pageSize ? Number(query.pageSize) : 20,
      keyword: query.keyword,
    });
  }

  // 管理端：详情
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  async getDetail(@Param('id') id: number) {
    return this.service.getDetail(Number(id));
  }

  // 管理端：创建
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  // 管理端：更新
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: number, @Body() body: any) {
    return this.service.update(Number(id), body);
  }

  // 管理端：删除
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: number) {
    return this.service.delete(Number(id));
  }

  // 管理端：启用/禁用
  @Put(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  async toggle(@Param('id') id: number, @Body() body: { isActive: boolean }) {
    return this.service.toggleActive(Number(id), body.isActive);
  }
}
