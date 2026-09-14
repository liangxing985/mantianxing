import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './config/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProviderModule } from './modules/provider/provider.module';
import { GameModule } from './modules/game/game.module';
import { OrderModule } from './modules/order/order.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AdminModule } from './modules/admin/admin.module';
import { MessageModule } from './modules/message/message.module';
import { KookModule } from './modules/kook/kook.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { ProductModule } from './modules/product/product.module';
import { ActivityModule } from './modules/activity/activity.module';
import { UploadModule } from './modules/upload/upload.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { ChatModule } from './modules/chat/chat.module';
import { RankModule } from './modules/rank/rank.module';
import { MembershipModule } from './modules/membership/membership.module';
import { DepositModule } from './modules/deposit/deposit.module';
import { GiftModule } from './modules/gift/gift.module';
import { InviteModule } from './modules/invite/invite.module';
import { TagModule } from './modules/tag/tag.module';
import { GameCategoryModule } from './modules/game-category/game-category.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { BannerModule } from './modules/banner/banner.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UserModule,
    ProviderModule,
    GameModule,
    OrderModule,
    WalletModule,
    AdminModule,
    MessageModule,
    KookModule,
    SystemConfigModule,
    ProductModule,
    ActivityModule,
    UploadModule,
    PricingModule,
    ChatModule,
    RankModule,
    MembershipModule,
    DepositModule,
    GiftModule,
    InviteModule,
    TagModule,
    GameCategoryModule,
    CouponModule,
    BannerModule,
  ],
})
export class AppModule {}
