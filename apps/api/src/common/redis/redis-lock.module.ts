import { Global, Module } from '@nestjs/common';
import { RedisLockService } from '@api/common/redis/redis-lock.service';

@Global()
@Module({
  providers: [RedisLockService],
  exports: [RedisLockService],
})
export class RedisLockModule {}
