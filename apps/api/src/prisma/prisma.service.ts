import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.$connect();
    }

    // Nest 在进程收到 SIGINT/SIGTERM 或 app.close() 时会调用这里
    async onModuleDestroy() {
        await this.$disconnect();
    }

    // 如果你仍然想从某处主动关闭整个应用：
    async enableShutdownHooks(app: INestApplication) {
        // 不用 prisma.$on('beforeExit') 了，直接交给 Nest
        // 例如某些场景你想触发 app.close():
        // await app.close();
    }
}