import { Module } from '@nestjs/common';
import { DeviceSecurityService } from './device-security.service';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { RedisModule } from '@api/common/redis/redis.module'; // 👈 确保引入 Prisma，因为 Service 用到了它

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [DeviceSecurityService],
  exports: [DeviceSecurityService],
})
export class DeviceModule {}
