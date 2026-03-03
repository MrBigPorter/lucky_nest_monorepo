import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { ClientCouponController } from '@api/client/coupon/coupon.controller';
import { ClientCouponService } from '@api/client/coupon/coupon.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClientCouponController],
  providers: [ClientCouponService],
  exports: [],
})
export class ClientCouponModule {}
