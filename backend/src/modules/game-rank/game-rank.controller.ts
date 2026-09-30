/**
 * 游戏段位控制器
 * 公开：按游戏查询段位列表
 * 管理端：段位CRUD（需ADMIN/OPERATOR角色）
 */
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { GameRankService } from './game-rank.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('game-rank')
export class GameRankController {
  constructor(private readonly gameRankService: GameRankService) {}

  // 公开：获取某游戏的段位列表
  @Get('game/:gameId')
  async getByGame(@Param('gameId') gameId: number) {
    return this.gameRankService.getByGame(gameId);
  }

  // 管理端：段位列表
  @Get('list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async list(@Query('gameId') gameId?: number) {
    return this.gameRankService.list(gameId ? Number(gameId) : undefined);
  }

  // 管理端：创建段位
  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: { gameId: number; name: string; level?: number; sortOrder?: number }) {
    return this.gameRankService.create(body);
  }

  // 管理端：更新段位
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: number, @Body() body: { name?: string; level?: number; sortOrder?: number }) {
    return this.gameRankService.update(id, body);
  }

  // 管理端：删除段位
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: number) {
    return this.gameRankService.delete(id);
  }
}
