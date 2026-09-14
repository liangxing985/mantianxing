import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { InviteService } from './invite.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('invite')
@UseGuards(JwtAuthGuard)
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Get('code')
  async getMyCode(@CurrentUser() user: any) {
    return this.inviteService.getMyInviteCode(user.id);
  }

  @Post('bind')
  async bindInviter(@CurrentUser() user: any, @Body() body: { inviteCode: string }) {
    return this.inviteService.bindInviter(user.id, body.inviteCode);
  }

  @Get('list')
  async getMyInvites(@CurrentUser() user: any) {
    return this.inviteService.getMyInvites(user.id);
  }

  @Get('commissions')
  async getMyCommissions(@CurrentUser() user: any, @Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    return this.inviteService.getMyCommissions(user.id, Number(page), Number(pageSize));
  }
}
