import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { NotificationController } from '@api/client/notification/notification.controller';
import { NotificationService } from '@api/client/notification/notification.service';
import { PushListener } from '@api/client/notification/listeners/push.listener';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, PushListener],
  exports: [NotificationService],
})
export class NotificationModule {}
