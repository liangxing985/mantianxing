import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // 保存上传的文件，返回可访问的 URL 路径
  saveFile(file: any): string {
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filepath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filepath, file.buffer);
    return `/uploads/${filename}`;
  }
}
