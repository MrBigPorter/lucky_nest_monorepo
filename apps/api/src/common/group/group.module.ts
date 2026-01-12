import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { GroupService } from '@api/common/group/group.service';
import { WalletModule } from '@api/client/wallet/wallet.module';
import { RedisLockModule } from '@api/common/redis/redis-lock.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    WalletModule,
    RedisLockModule,
    BullModule.registerQueue({
      name: 'group_settlement',
    }),
  ],
  controllers: [],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
