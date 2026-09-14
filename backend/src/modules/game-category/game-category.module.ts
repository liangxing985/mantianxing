import { Module } from '@nestjs/common';
import { GameCategoryService } from './game-category.service';
import { GameCategoryController } from './game-category.controller';

@Module({
  controllers: [GameCategoryController],
  providers: [GameCategoryService],
  exports: [GameCategoryService],
})
export class GameCategoryModule {}
