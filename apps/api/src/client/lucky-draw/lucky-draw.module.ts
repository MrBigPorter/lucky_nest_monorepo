import { Module } from '@nestjs/common';
import { LuckyDrawModule } from '@api/common/lucky-draw/lucky-draw.module';
import { WalletModule } from '@api/client/wallet/wallet.module';
import { ClientCouponModule } from '@api/client/coupon/coupon.module';
import { ClientLuckyDrawController } from './lucky-draw.controller';

@Module({
  imports: [LuckyDrawModule, WalletModule, ClientCouponModule],
  controllers: [ClientLuckyDrawController],
})
export class ClientLuckyDrawModule {}
