import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { LoginLogController } from './login-log.controller';
import { LoginLogService } from './login-log.service';

@Module({
  imports: [PrismaModule],
  controllers: [LoginLogController],
  providers: [LoginLogService],
})
export class LoginLogModule {}

