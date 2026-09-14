import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get('levels')
  async getLevels() {
    return this.membershipService.getLevels();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyMembership(@CurrentUser() user: any) {
    return this.membershipService.getMyMembership(user.id);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  async purchase(@CurrentUser() user: any, @Body() body: { level: number; months: number }) {
    return this.membershipService.purchase(user.id, body.level, body.months);
  }

  // 管理端
  @Post('levels')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createLevel(@Body() body: any) {
    return this.membershipService.createLevel(body);
  }

  @Put('levels/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateLevel(@Param('id') id: string, @Body() body: any) {
    return this.membershipService.updateLevel(Number(id), body);
  }

  @Delete('levels/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteLevel(@Param('id') id: string) {
    return this.membershipService.deleteLevel(Number(id));
  }
}
