import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { NotificationModule as ClientNotificationModule } from '@api/client/notification/notification.module';
import { AdminNotificationController } from './notification.controller';
import { AdminNotificationService } from './notification.service';

@Module({
  imports: [PrismaModule, ClientNotificationModule],
  controllers: [AdminNotificationController],
  providers: [AdminNotificationService],
  exports: [],
})
export class AdminNotificationModule {}

