import { forwardRef, Module } from '@nestjs/common';
import { WalletService } from '@api/client/wallet/wallet.service';
import { WalletController } from '@api/client/wallet/wallet.controller';
import { ClientWalletService } from '@api/client/wallet/client-wallet.service';
import { PaymentWebhookController } from '@api/client/wallet/payment-webhook.controller';
import { PaymentChannelService } from '@api/common/payment-channel/payment-channel.service';

@Module({
  providers: [WalletService, ClientWalletService, PaymentChannelService],
  controllers: [WalletController, PaymentWebhookController],
  exports: [WalletService, ClientWalletService],
})
export class WalletModule {}
