import { Module } from '@nestjs/common';
import { PaymentChannelModule } from '@api/common/payment-channel/payment-channel.module';
import { PaymentClientController } from '@api/client/payment-channel/payment-channel.controller';

@Module({
  imports: [PaymentChannelModule],
  providers: [],
  controllers: [PaymentClientController],
  exports: [],
})
export class PaymentChannelClientModule {}
