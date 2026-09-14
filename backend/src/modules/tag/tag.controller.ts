import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TagService } from './tag.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async getAllTags(@Query('category') category?: string) {
    return this.tagService.getTags(category);
  }

  @Get('list')
  async getTags(@Query('category') category?: string) {
    return this.tagService.getTags(category);
  }

  @Get('user/:userId')
  async getUserTags(@Param('userId') userId: string) {
    return this.tagService.getUserTags(Number(userId));
  }

  @Post('my')
  @UseGuards(JwtAuthGuard)
  async setMyTags(@CurrentUser() user: any, @Body() body: { tagIds: number[] }) {
    return this.tagService.setUserTags(user.id, body.tagIds);
  }

  @Post('voice')
  @UseGuards(JwtAuthGuard)
  async setVoiceTag(@CurrentUser() user: any, @Body() body: { voiceTag: string }) {
    return this.tagService.setVoiceTag(user.id, body.voiceTag);
  }

  // 管理端
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createTag(@Body() body: any) {
    return this.tagService.createTag(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateTag(@Param('id') id: string, @Body() body: any) {
    return this.tagService.updateTag(Number(id), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteTag(@Param('id') id: string) {
    return this.tagService.deleteTag(Number(id));
  }
}
