import { Module } from '@nestjs/common';
import { RegisterApplicationService } from './register-application.service';
import {
  ApplyController,
  ApplicationsAdminController,
} from './register-application.controller';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { PasswordService } from '@api/common/service/password.service';
import { RedisModule } from '@api/common/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ApplyController, ApplicationsAdminController],
  providers: [RegisterApplicationService, PasswordService],
})
export class RegisterApplicationModule {}
