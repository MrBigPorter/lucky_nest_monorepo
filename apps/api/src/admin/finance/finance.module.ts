import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { WalletModule } from '@api/client/wallet/wallet.module';
import { FinanceTask } from '@api/admin/finance/finance.task';
@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [FinanceController],
  providers: [FinanceService, FinanceTask],
})
export class FinanceModule {}
