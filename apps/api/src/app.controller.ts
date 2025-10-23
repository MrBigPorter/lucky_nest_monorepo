import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service'; // ✅ 用我们封装的单例

//示例路由（可删）
// Controller 里通过装饰器（@Get/@Post）登记“这是谁的路由”。
@Controller()
export class AppController {
    constructor(private readonly prisma: PrismaService) {}

    @Get('health')
    health() {
        return { ok: true };
    }

    @Get('dbcheck')
    // src/app.controller.ts
    async dbcheck() {
        const users = await this.prisma.user.count();
        const rows = await this.prisma.$queryRaw<{ now: string }[]>`select now() as now`;
        const first = rows.length ? rows[0] : undefined;
        return { users, dbTime: first?.now ?? null };
    }
}