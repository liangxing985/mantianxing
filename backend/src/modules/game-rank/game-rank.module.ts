import { Module } from '@nestjs/common';
import { GameRankService } from './game-rank.service';
import { GameRankController } from './game-rank.controller';

@Module({
  controllers: [GameRankController],
  providers: [GameRankService],
  exports: [GameRankService],
})
export class GameRankModule {}
