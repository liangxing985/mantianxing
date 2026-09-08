import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // 公开：老板端商品列表
  @Get('public/list')
  async getPublicList() {
    return this.productService.getPublicList();
  }

  // 管理端：商品列表
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  async getList(@Query() query: any) {
    return this.productService.getAdminList({
      page: query.page ? Number(query.page) : 1,
      pageSize: query.pageSize ? Number(query.pageSize) : 20,
      keyword: query.keyword,
      category: query.category,
    });
  }

  // 管理端：商品详情
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  async getDetail(@Param('id') id: number) {
    return this.productService.getDetail(Number(id));
  }

  // 管理端：创建商品
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() body: any) {
    return this.productService.create(body);
  }

  // 管理端：更新商品
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: number, @Body() body: any) {
    return this.productService.update(Number(id), body);
  }

  // 管理端：删除商品
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: number) {
    return this.productService.delete(Number(id));
  }

  // 管理端：上下架
  @Put(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  async toggle(@Param('id') id: number, @Body() body: { isActive: boolean }) {
    return this.productService.toggleActive(Number(id), body.isActive);
  }
}
