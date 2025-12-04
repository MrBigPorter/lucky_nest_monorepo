import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

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
    const rows = await this.prisma.$queryRaw<
      { now: string }[]
    >`select now() as now`;
    const first = rows.length ? rows[0] : undefined;
    return { users, dbTime: first?.now ?? null };
  }
}
