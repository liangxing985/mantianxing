import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { GameCategoryService } from './game-category.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('game-categories')
export class GameCategoryController {
  constructor(private readonly service: GameCategoryService) {}

  // 公开接口：获取所有启用的分类（含游戏）
  @Get()
  async getAll() {
    return this.service.getAll();
  }

  // 管理端接口
  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async list() {
    return this.service.list();
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async create(@Body() body: { name: string; icon?: string; sortOrder?: number }) {
    return this.service.create(body);
  }

  @Put('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async update(@Param('id') id: number, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: number) {
    return this.service.delete(id);
  }
}
