import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { GroupController } from '@api/common/group/group.controller';
import { GroupService } from '@api/common/group/group.service';
import { RedisLockService } from '@api/common/redis/redis-lock.service';
import { WalletModule } from '@api/client/wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [GroupController],
  providers: [GroupService, RedisLockService],
  exports: [GroupService],
})
export class GroupModule {}
