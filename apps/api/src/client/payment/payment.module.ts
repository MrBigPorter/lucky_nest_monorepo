import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { WalletModule } from '@api/client/wallet/wallet.module';
import { PaymentController } from '@api/client/payment/payment.controller';
import { PaymentService } from '@api/client/payment/payment.service';

@Module({
  imports: [PrismaModule, forwardRef(() => WalletModule)],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
