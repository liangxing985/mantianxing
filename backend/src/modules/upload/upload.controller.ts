import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // 上传图片（所有登录用户可用：管理员/客服/老板/陪玩）
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      return { url: '' };
    }
    const url = this.uploadService.saveFile(file);
    return { url };
  }
}
