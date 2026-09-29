import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { KookModule } from '../kook/kook.module';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  imports: [KookModule, CouponModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
