import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health() {
    const db = await this.prisma.ping();
    return {
      status: db ? 'ok' : 'degraded',
      checks: { db },
      timestamp: new Date().toISOString(),
    };
  }
}
