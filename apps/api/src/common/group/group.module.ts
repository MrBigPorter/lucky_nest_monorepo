import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { GroupService } from '@api/common/group/group.service';
import { WalletModule } from '@api/client/wallet/wallet.module';
import { RedisLockModule } from '@api/common/redis/redis-lock.module';
import { BullModule } from '@nestjs/bullmq';
import { EventsModule } from '@api/common/events/events.module';

@Module({
  imports: [
    PrismaModule,
    WalletModule,
    RedisLockModule,
    EventsModule,
    BullModule.registerQueue({
      name: 'group_settlement',
    }),
  ],
  controllers: [],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
