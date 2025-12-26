import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  private client!: RedisClientType;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error('REDIS_URL is not defined');
    }

    // 建立连接
    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    await this.client.connect();
    this.logger.log(' Redis General Client connected successfully');
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis General Client disconnected');
    }
  }

  // ==========================================
  //  基础 Key-Value 操作
  // ==========================================

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  // ==========================================
  //  Set 集合操作 (黑名单用)
  // ==========================================

  async sismember(key: string, member: string): Promise<boolean> {
    return await this.client.sIsMember(key, member);
  }

  async sadd(key: string, member: string): Promise<number> {
    return await this.client.sAdd(key, member);
  }

  async srem(key: string, member: string): Promise<number> {
    return await this.client.sRem(key, member);
  }
}
