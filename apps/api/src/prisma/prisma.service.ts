// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

// 事件最小结构
type LogEvent   = { message: string };
type QueryEvent = { duration: number; query: string; params?: string };

// 固定包含 query，避免 $on 被推成 never
const LOG_CONFIG = [
    { level: 'warn',  emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'query', emit: 'event' },
] as const satisfies Prisma.LogDefinition[];

// 收窄签名（仅为类型提示）
type OnLogFn   = (t: 'warn'  | 'error', l: (e: LogEvent)   => void) => void;
type OnQueryFn = (t: 'query',            l: (e: QueryEvent) => void) => void;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    private readonly isDev  = process.env.NODE_ENV !== 'production';
    private readonly slowMs = Number(process.env.PRISMA_SLOW_MS ?? (this.isDev ? 80 : 200));

    constructor() {
        super({
            errorFormat: process.env.NODE_ENV !== 'production' ? 'pretty' : 'minimal',
            log: LOG_CONFIG as unknown as Prisma.LogDefinition[],
        });

        // 关键：把 $on 绑定回当前实例，避免丢失 this
        const onLog   = (this.$on as unknown as OnLogFn).bind(this);
        const onQuery = (this.$on as unknown as OnQueryFn).bind(this);

        onLog('warn',  (e) => this.logger.warn(e.message));
        onLog('error', (e) => this.logger.error(e.message));

        onQuery('query', (e) => {
            if (!this.isDev) return; // 生产不输出
            const took   = e.duration;
            const prefix = took > this.slowMs ? '🐢 SLOW' : 'SQL';
            this.logger.log(`${prefix} ${took}ms ${e.query}${e.params ? ` | params=${e.params}` : ''}`);
        });
    }

    async onModuleInit() {
        for (let i = 1; i <= 8; i++) {
            try { await this.$connect(); this.logger.log('Prisma connected'); return; }
            catch (err: any) {
                const backoff = Math.min(1000 * 2 ** (i - 1), 10_000);
                this.logger.warn(`Prisma connect failed #${i}: ${err?.message ?? err}. Retry in ${backoff}ms`);
                await sleep(backoff);
            }
        }
        throw new Error('Prisma failed to connect');
    }

    async onModuleDestroy() {
        try { await this.$disconnect(); }
        catch (e: any) { this.logger.error(`Prisma disconnect error: ${e?.message ?? e}`); }
    }

    async ping(): Promise<boolean> {
        try { await this.$queryRaw`SELECT 1`; return true; }
        catch (e: any) { this.logger.warn(`DB ping failed: ${e?.message ?? e}`); return false; }
    }

    async explain(sql: string) {
        if (!this.isDev) return [];
        try { return await this.$queryRawUnsafe<any[]>(`EXPLAIN ${sql}`); }
        catch (e: any) { this.logger.warn(`EXPLAIN failed: ${e?.message ?? e}`); return []; }
    }
}