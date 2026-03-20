// apps/api/src/prisma/prisma.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** Extract a human-readable message from any thrown value. */
function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// 事件最小结构
type LogEvent = { message: string };
type QueryEvent = { duration: number; query: string; params?: string };

// Prisma v6 removed LogDefinition from the generated-client Prisma namespace —
// define it locally so the constructor log option stays type-safe.
type LogDefinition = {
  level: 'query' | 'info' | 'warn' | 'error';
  emit: 'stdout' | 'event';
};

// 固定包含 query，避免 $on 被推成 never
const LOG_CONFIG: LogDefinition[] = [
  { level: 'warn', emit: 'event' },
  { level: 'error', emit: 'event' },
  { level: 'query', emit: 'event' },
];

// 收窄签名（仅为类型提示）
type OnLogFn = (t: 'warn' | 'error', l: (e: LogEvent) => void) => void;
type OnQueryFn = (t: 'query', l: (e: QueryEvent) => void) => void;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly isDev = process.env.NODE_ENV !== 'production';
  private readonly slowMs = Number(
    process.env.PRISMA_SLOW_MS ?? (this.isDev ? 80 : 200),
  );

  constructor() {
    super({
      errorFormat: process.env.NODE_ENV !== 'production' ? 'pretty' : 'minimal',
      log: LOG_CONFIG,
    });

    // 关键：把 $on 绑定回当前实例，避免丢失 this
    const onLog = (this.$on as unknown as OnLogFn).bind(this);
    const onQuery = (this.$on as unknown as OnQueryFn).bind(this);

    onLog('warn', (e) => this.logger.warn(e.message));
    onLog('error', (e) => this.logger.error(e.message));

    onQuery('query', (e) => {
      if (!this.isDev) return; // 生产不输出
      const took = e.duration;
      const prefix = took > this.slowMs ? '🐢 SLOW' : 'SQL';
      this.logger.log(
        `${prefix} ${took}ms ${e.query}${e.params ? ` | params=${e.params}` : ''}`,
      );
    });
  }

  async onModuleInit() {
    for (let i = 1; i <= 8; i++) {
      try {
        await this.$connect();
        this.logger.log('Prisma connected');
        return;
      } catch (err: unknown) {
        const backoff = Math.min(1000 * 2 ** (i - 1), 10_000);
        this.logger.warn(
          `Prisma connect failed #${i}: ${errMsg(err)}. Retry in ${backoff}ms`,
        );
        await sleep(backoff);
      }
    }
    throw new Error('Prisma failed to connect');
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (e: unknown) {
      this.logger.error(`Prisma disconnect error: ${errMsg(e)}`);
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (e: unknown) {
      this.logger.warn(`DB ping failed: ${errMsg(e)}`);
      return false;
    }
  }
}
