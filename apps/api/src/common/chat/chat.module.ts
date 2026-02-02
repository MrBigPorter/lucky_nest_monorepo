import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { ChatController } from '@api/common/chat/chat.controller';
import { ChatService } from '@api/common/chat/chat.service';
import { EventsModule } from '@api/common/events/events.module';
import { UploadModule } from '@api/common/upload/upload.module';
import { AvatarModule } from '@api/common/avatar/avatar.module';
import { AVATAR_QUEUE_NAME } from '@api/common/avatar/avatar.processor';
import { BullModule } from '@nestjs/bullmq';
import { ContactController } from '@api/common/contact/contact.controller';
import { ContactService } from '@api/common/contact/contact.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: AVATAR_QUEUE_NAME }),
    PrismaModule,
    EventsModule,
    UploadModule,
    AvatarModule,
  ],
  controllers: [ChatController, ContactController],
  providers: [ChatService, ContactService],
  exports: [ChatService, ContactService],
})
export class ChatModule {}
