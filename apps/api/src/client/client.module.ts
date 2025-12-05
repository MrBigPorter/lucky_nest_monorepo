import { Module } from '@nestjs/common';
import { AuthModule } from '@api/client/auth/auth.module';
import { OtpModule } from '@api/client/otp/otp.module';
import { TreasureModule } from '@api/client/treasure/treasure.module';
import { CategoryModule } from '@api/client/category/category.module';
import { BannersModule } from '@api/client/banners/banners.module';
import { AdsModule } from '@api/client/ads/ads.module';
import { SectionsModule } from '@api/client/sections/sections.module';
import { GroupModule } from '@api/common/group/group.module';
import { WalletModule } from '@api/client/wallet/wallet.module';
import { OrderModule } from '@api/client/orders/order.module';
import { HealthController } from '@api/client/health/health.controller';

@Module({
  imports: [
    AuthModule,
    OtpModule,
    TreasureModule,
    CategoryModule,
    BannersModule,
    AdsModule,
    SectionsModule,
    GroupModule,
    WalletModule,
    OrderModule,
  ],
  providers: [],
  controllers: [HealthController],
})
export class ClientModule {}
