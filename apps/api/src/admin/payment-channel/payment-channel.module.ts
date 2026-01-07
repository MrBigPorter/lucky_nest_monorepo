import { Module } from '@nestjs/common';
import { PaymentChannelModule } from '@api/common/payment-channel/payment-channel.module';
import { PaymentChannelController } from '@api/admin/payment-channel/payment-channel.controller';

@Module({
  imports: [PaymentChannelModule],
  providers: [],
  controllers: [PaymentChannelController],
  exports: [],
})
export class AdminPaymentChannelModule {}
