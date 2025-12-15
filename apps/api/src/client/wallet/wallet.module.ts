import { forwardRef, Module } from '@nestjs/common';
import { WalletService } from '@api/client/wallet/wallet.service';
import { WalletController } from '@api/client/wallet/wallet.controller';
import { ClientWalletService } from '@api/client/wallet/client-wallet.service';
import { PaymentModule } from '@api/client/payment/payment.module';

@Module({
  imports: [forwardRef(() => PaymentModule)],
  providers: [WalletService, ClientWalletService],
  exports: [WalletService, ClientWalletService],
  controllers: [WalletController],
})
export class WalletModule {}
