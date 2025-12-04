import { Module } from '@nestjs/common';
import { OrderService } from '@api/orders/order.service';
import { OrderController } from '@api/orders/order.controller';
import { PrismaModule } from '@api/prisma/prisma.module';
import { WalletService } from '@api/wallet/wallet.service';
import { WalletModule } from '@api/wallet/wallet.module';
import { PrismaService } from '@api/prisma/prisma.service';
import { GroupModule } from '@api/group/group.module';

@Module({
  imports: [PrismaModule, WalletModule, GroupModule],
  controllers: [OrderController],
  providers: [OrderService, PrismaService],
  exports: [],
})
export class OrderModule {}
