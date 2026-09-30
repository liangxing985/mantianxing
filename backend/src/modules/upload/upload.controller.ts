/**
 * 文件上传控制器
 * 提供图片上传接口，需登录后访问
 * 上传文件存储在服务器uploads目录，返回可访问的URL
 */
import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // 上传图片（所有登录用户可上传头像/凭证等）
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
