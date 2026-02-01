import { Module } from '@nestjs/common';
import { MediaController } from '@api/common/media/media.controller';
import { MediaService } from '@api/common/media/media.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
