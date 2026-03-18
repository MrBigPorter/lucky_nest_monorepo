import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { WalletModule } from '@api/client/wallet/wallet.module';
import { LuckyDrawService } from './lucky-draw.service';

@Module({
  imports: [PrismaModule, WalletModule],
  providers: [LuckyDrawService],
  exports: [LuckyDrawService],
})
export class LuckyDrawModule {}
