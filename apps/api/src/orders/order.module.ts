import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from '@api/prisma/prisma.module';
import { WalletModule } from '@api/wallet/wallet.module';
import { GroupModule } from '@api/group/group.module';
import { CouponsModule } from '@api/coupons/coupons.module';

@Module({
  imports: [PrismaModule, WalletModule, GroupModule, CouponsModule],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
