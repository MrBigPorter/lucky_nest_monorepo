import { Global, Module } from '@nestjs/common';
import { PaymentService } from '@api/common/payment/payment.service';

@Global()
@Module({
  imports: [],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
