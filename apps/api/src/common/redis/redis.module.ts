import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisLockService } from './redis-lock.service'; // 你原有的 Lock 服务

@Global()
@Module({
  providers: [RedisService, RedisLockService],
  exports: [RedisService, RedisLockService],
})
export class RedisModule {}
