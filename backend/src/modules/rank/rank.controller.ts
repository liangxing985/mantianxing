import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RankService } from './rank.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('rank')
export class RankController {
  constructor(private readonly rankService: RankService) {}

  @Get('income')
  async getIncomeRank(@Query('limit') limit = '20') {
    return this.rankService.getIncomeRank(Number(limit));
  }

  @Get('order')
  async getOrderRank(@Query('limit') limit = '20') {
    return this.rankService.getOrderRank(Number(limit));
  }

  @Get('rating')
  async getRatingRank(@Query('limit') limit = '20') {
    return this.rankService.getRatingRank(Number(limit));
  }

  @Get('consumer')
  async getConsumerRank(@Query('limit') limit = '20') {
    return this.rankService.getConsumerRank(Number(limit));
  }

  @Get('gift')
  async getGiftRank(@Query('limit') limit = '20') {
    return this.rankService.getGiftRank(Number(limit));
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyRank(@CurrentUser() user: any, @Query('type') type: 'income' | 'order' | 'rating' = 'income') {
    return this.rankService.getMyRank(user.id, type);
  }
}
