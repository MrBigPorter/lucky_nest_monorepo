import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { UploadModule } from '@api/common/upload/upload.module';
import { EventsModule } from '@api/common/events/events.module';
import { AdminChatController } from './admin-chat.controller';
import { AdminChatService } from './admin-chat.service';

@Module({
  imports: [PrismaModule, UploadModule, EventsModule],
  controllers: [AdminChatController],
  providers: [AdminChatService],
})
export class AdminChatModule {}
