import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { createClient, RedisClientType } from 'redis';

const UNLOCK_SCRIPT = `
   if redis.call("get", KEYS[1]) == ARGV[1] then
       return redis.call("del", KEYS[1])
   else
       return 0
   end
`;

@Injectable()
export class RedisLockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisLockService.name);
  private client: RedisClientType | undefined;

  constructor(private readonly configService: ConfigService) {}

  /**
   * 模块初始化时建立 Redis 连接
   */
  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error('REDIS_URL is not defined in configuration');
    }

    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    await this.client.connect();
    this.logger.log('🔐 Redis Lock Client connected successfully (Dedicated)');
  }

  /**
   * 模块销毁时关闭 Redis 连接
   */
  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis Lock Client disconnected successfully.');
    }
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
    if (!this.client?.isOpen) {
      throw new Error('Redis Lock Client is not connected');
    }

    const lockValue = crypto.randomUUID();

    // 1. 加锁 (SET NX PX)
    const result = await this.client.set(key, lockValue, {
      NX: true,
      PX: ttl,
    });

    if (result !== 'OK') {
      throw new Error(`Lock busy: ${key}`);
    }

    try {
      // 2. 执行业务逻辑
      return await callback();
    } finally {
      try {
        // 3. 解锁 (Lua 脚本)
        await this.client.eval(UNLOCK_SCRIPT, {
          keys: [key],
          arguments: [lockValue],
        });
      } catch (e) {
        this.logger.error(`Failed to release lock for key ${key}: ${e}`);
      }
    }
  }
}
