import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { UploadModule } from '@api/common/upload/upload.module';
import { AdminChatController } from './admin-chat.controller';
import { AdminChatService } from './admin-chat.service';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [AdminChatController],
  providers: [AdminChatService],
})
export class AdminChatModule {}
