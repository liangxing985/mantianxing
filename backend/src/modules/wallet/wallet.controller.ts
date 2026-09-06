import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // 钱包信息
  @Get('info')
  async getWallet(@CurrentUser() user: any) {
    return this.walletService.getWallet(user.id);
  }

  // 流水记录
  @Get('transactions')
  async getTransactions(@CurrentUser() user: any, @Query() query: any) {
    return this.walletService.getTransactions(user.id, query);
  }

  // 申请提现
  @Post('withdraw')
  async applyWithdraw(@CurrentUser() user: any, @Body() body: any) {
    return this.walletService.applyWithdraw(user.id, body);
  }

  // 提现记录
  @Get('withdraw/list')
  async getWithdrawList(@CurrentUser() user: any, @Query() query: any) {
    return this.walletService.getWithdrawList(user.id, query);
  }
}
