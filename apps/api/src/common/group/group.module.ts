import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { GroupService } from '@api/common/group/group.service';
import { WalletModule } from '@api/client/wallet/wallet.module';
import { RedisLockModule } from '@api/common/redis/redis-lock.module';
import { BullModule } from '@nestjs/bullmq';
import { EventsModule } from '@api/common/events/events.module';
import { NotificationModule } from '@api/client/notification/notification.module';
import { AvatarModule } from '@api/common/avatar/avatar.module';
import { LotteryModule } from '@api/common/lottery/lottery.module';
import { LuckyDrawModule } from '@api/common/lucky-draw/lucky-draw.module';
import { GroupProcessor } from '@api/common/group/processors/group.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'group_settlement',
    }),
    PrismaModule,
    WalletModule,
    RedisLockModule,
    EventsModule,
    NotificationModule,
    AvatarModule,
    LotteryModule,
    LuckyDrawModule,
  ],
  controllers: [],
  providers: [GroupService, GroupProcessor],
  exports: [GroupService],
})
export class GroupModule {}
