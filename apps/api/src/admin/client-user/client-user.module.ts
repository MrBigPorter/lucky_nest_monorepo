import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { ClientUserController } from '@api/admin/client-user/client-user.controller';
import { ClientUserService } from '@api/admin/client-user/client-user.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClientUserController],
  providers: [ClientUserService],
})
export class ClientUserModule {}
