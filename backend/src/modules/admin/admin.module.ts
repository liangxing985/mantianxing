import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SystemConfigModule } from '../system-config/system-config.module';
import { InviteModule } from '../invite/invite.module';

@Module({
  imports: [SystemConfigModule, InviteModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
