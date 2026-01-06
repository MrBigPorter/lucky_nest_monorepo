import { Module } from '@nestjs/common';
import { OrderController } from '@api/admin/order/order.controller';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { OrderService } from '@api/admin/order/order.service';
import { WalletModule } from '@api/client/wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
