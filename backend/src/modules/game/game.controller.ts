import { Controller, Get, Param } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  // 获取游戏列表（含服务项目）- 公开接口
  @Get('list')
  async getGameList() {
    return this.gameService.getGameList();
  }

  // 获取游戏详情
  @Get(':id')
  async getGameDetail(@Param('id') id: number) {
    return this.gameService.getGameDetail(id);
  }

  // 获取服务项目详情
  @Get('service/:id')
  async getServiceItemDetail(@Param('id') id: number) {
    return this.gameService.getServiceItemDetail(id);
  }
}
