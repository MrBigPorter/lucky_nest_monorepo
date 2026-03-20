import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';

@Injectable()
export class SystemConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const configs = await this.prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });
    return { list: configs };
  }

  async update(key: string, dto: UpdateSystemConfigDto) {
    const existing = await this.prisma.systemConfig.findUnique({
      where: { key },
    });
    if (!existing) throw new NotFoundException(`Config key "${key}" not found`);

    return this.prisma.systemConfig.update({
      where: { key },
      data: { value: dto.value },
    });
  }
}
