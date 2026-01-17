import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { ChatController } from '@api/common/chat/chat.controller';
import { ChatService } from '@api/common/chat/chat.service';
import { EventsModule } from '@api/common/events/events.module';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
