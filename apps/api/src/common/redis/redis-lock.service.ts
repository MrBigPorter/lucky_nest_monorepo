import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';

const UNLOCK_SCRIPT = `
   if redis.call("get", KEYS[1]) == ARGV[1] then
       return redis.call("del", KEYS[1])
   else
       return 0
   end
`;

@Injectable()
export class RedisLockService {
  private readonly logger = new Logger(RedisLockService.name);
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * 获取底层 Redis Client (Node-Redis v4)
   * @private
   */
  private getClient() {
    const store = this.cacheManager.store as any;
    if (!store.client) {
      throw new Error('Cache store does not have a client property');
    }
    return store.client;
  }

  /**
   * 使用 Redis 分布式锁执行回调函数
   * @param key 锁的 Key
   * @param ttl 锁的超时时间（毫秒）
   * @param callback 要执行的异步回调函数
   */
  async runWithLock<T>(
    key: string,
    ttl: number,
    callback: () => Promise<T>,
  ): Promise<T> {
    const client = this.getClient();
    const lockValue = crypto.randomUUID();

    // 1. 加锁
    // NX: 只有不存在时才设置
    // PX: 毫秒级过期
    const result = await client.set(key, lockValue, { NX: true, PX: ttl });

    if (result !== 'OK') {
      // 这里的 Error 会被上面层级捕获
      throw new Error(`Lock busy: ${key}`);
    }

    try {
      // Execute the callback while holding the lock
      return await callback();
    } finally {
      try {
        // Release the lock using the Lua script to ensure we only delete if we own the lock
        await client.eval(UNLOCK_SCRIPT, {
          keys: [key],
          arguments: [lockValue],
        });
      } catch (e) {
        this.logger.error(`Failed to release lock for key ${key}: ${e}`);
      }
    }
  }
}
