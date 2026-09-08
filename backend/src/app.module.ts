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
  ],
})
export class AppModule {}
