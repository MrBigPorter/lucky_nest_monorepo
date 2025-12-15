import { Module } from '@nestjs/common';
import { WalletService } from '@api/client/wallet/wallet.service';
import { WalletController } from '@api/client/wallet/wallet.controller';
import { ClientWalletService } from '@api/client/wallet/client-wallet.service';

@Module({
  providers: [WalletService, ClientWalletService],
  exports: [WalletService],
  controllers: [WalletController],
})
export class WalletModule {}
