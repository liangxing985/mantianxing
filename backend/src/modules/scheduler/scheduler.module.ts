/**
 * 定时任务模块
 * 提供订单过期自动取消退款等系统定时任务
 */
import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Module({
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
