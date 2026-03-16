import { Module } from '@nestjs/common';
import { AuthModule } from '@api/admin/auth/auth.module';
import { UserModule } from '@api/admin/user/user.module';
import { CategoryModule } from '@api/admin/category/category.module';
import { TreasureModule } from '@api/admin/treasure/treasure.module';
import { ActSectionModule } from '@api/admin/act-section/act-section.module';
import { BannerModule } from '@api/admin/banner/banner.module';
import { OrderModule } from '@api/admin/order/order.module';
import { CouponModule } from '@api/admin/coupon/coupon.module';
import { FinanceModule } from '@api/admin/finance/finance.module';
import { KycModule } from '@api/admin/kyc/kyc.module';
import { AddressModule } from '@api/admin/address/address.module';
import { AdminRegionModule } from '@api/admin/region/admin-region.module';
import { ClientUserModule } from '@api/admin/client-user/client-user.module';
import { AdminPaymentChannelModule } from '@api/admin/payment-channel/payment-channel.module';
import { GroupAdminModule } from '@api/admin/group/groups.module';
import { StatsModule } from '@api/admin/stats/stats.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    CategoryModule,
    TreasureModule,
    ActSectionModule,
    BannerModule,
    OrderModule,
    CouponModule,
    FinanceModule,
    KycModule,
    AddressModule,
    AdminRegionModule,
    ClientUserModule,
    AdminPaymentChannelModule,
    GroupAdminModule,
    StatsModule,
  ],
  providers: [],
  controllers: [],
})
export class AdminModule {}
