import { Module } from '@nestjs/common';
import { OrderController } from '@api/admin/order/order.controller';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { OrderService } from '@api/admin/order/order.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
