import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('deposit')
@UseGuards(JwtAuthGuard)
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Get('my')
  async getMyDeposit(@CurrentUser() user: any) {
    return this.depositService.getMyDeposit(user.id);
  }

  @Post('pay')
  async payDeposit(@CurrentUser() user: any, @Body() body: { amount: number }) {
    return this.depositService.payDeposit(user.id, body.amount);
  }

  @Post('refund')
  async refundDeposit(@CurrentUser() user: any, @Body() body: { amount: number }) {
    return this.depositService.refundDeposit(user.id, body.amount);
  }

  @Post('deduct')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async deductDeposit(@CurrentUser() user: any, @Body() body: { userId: number; amount: number; remark: string }) {
    return this.depositService.deductDeposit(body.userId, body.amount, body.remark, user.id);
  }
}
