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
    async dbcheck() {
        const users = await this.prisma.user.count();
        // 也能做一次简单探活
        const [{ now }] = await this.prisma.$queryRawUnsafe<{ now: string }[]>(
            'select now()'
        );
        return { users, dbTime: now };
    }
}