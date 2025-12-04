import { Module } from '@nestjs/common';
import { WalletService } from '@api/client/wallet/wallet.service';
import { WalletController } from '@api/client/wallet/wallet.controller';

@Module({
  providers: [WalletService],
  exports: [WalletService],
  controllers: [WalletController],
})
export class WalletModule {}
