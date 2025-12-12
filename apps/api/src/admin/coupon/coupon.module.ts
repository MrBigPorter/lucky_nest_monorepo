import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { CouponController } from '@api/admin/coupon/coupon.controller';
import { CouponService } from '@api/admin/coupon/coupon.service';

@Module({
  imports: [PrismaModule],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [],
})
export class CouponModule {}
