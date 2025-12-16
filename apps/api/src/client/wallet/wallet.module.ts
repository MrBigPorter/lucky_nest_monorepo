import { forwardRef, Module } from '@nestjs/common';
import { WalletService } from '@api/client/wallet/wallet.service';
import { WalletController } from '@api/client/wallet/wallet.controller';
import { ClientWalletService } from '@api/client/wallet/client-wallet.service';
import { PaymentWebhookController } from '@api/client/wallet/payment-webhook.controller';

@Module({
  providers: [WalletService, ClientWalletService],
  controllers: [WalletController, PaymentWebhookController],
  exports: [WalletService, ClientWalletService],
})
export class WalletModule {}
