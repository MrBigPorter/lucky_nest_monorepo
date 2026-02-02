import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { UploadModule } from '@api/common/upload/upload.module';
import { EventsModule } from '@api/common/events/events.module';
import { AvatarService } from './avatar.service';
import {
  AVATAR_QUEUE_NAME,
  AvatarProcessor,
} from '@api/common/avatar/avatar.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: AVATAR_QUEUE_NAME,
    }),
    UploadModule,
    PrismaModule,
    EventsModule,
  ],
  controllers: [],
  providers: [AvatarService, AvatarProcessor],
  exports: [BullModule, AvatarService], // 导出 BullModule 以便业务层发送任务
})
export class AvatarModule {}
