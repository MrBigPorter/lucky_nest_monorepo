import { Module } from '@nestjs/common';
import { PaymentChannelService } from '@api/common/payment-channel/payment-channel.service';
import { PrismaModule } from '@api/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PaymentChannelService],
  exports: [PaymentChannelService],
})
export class PaymentChannelModule {}
