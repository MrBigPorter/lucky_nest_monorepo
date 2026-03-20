import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { LotteryService } from './lottery.service';

@Module({
  imports: [PrismaModule],
  providers: [LotteryService],
  exports: [LotteryService],
})
export class LotteryModule {}
