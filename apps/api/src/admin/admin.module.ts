import { Module } from '@nestjs/common';
import { AuthModule } from '@api/admin/auth/auth.module';
import { UserModule } from '@api/admin/user/user.module';
import { CategoryModule } from '@api/admin/category/category.module';
import { TreasureModule } from '@api/admin/treasure/treasure.module';
import { ActSectionModule } from '@api/admin/act-section/act-section.module';
import { BannerModule } from '@api/admin/banner/banner.module';
import { OrderModule } from '@api/admin/order/order.module';
import { CouponModule } from '@api/admin/coupon/coupon.module';

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
  ],
  providers: [],
  controllers: [],
})
export class AdminModule {}
