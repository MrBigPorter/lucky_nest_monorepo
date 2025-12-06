import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from '@api/common/upload/upload.controller';
import { UploadService } from '@api/common/upload/upload.service';

@Module({
  imports: [ConfigModule], //依赖 ConfigModule 读取 .env
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService], // 导出 Service，以后 User 模块如果要上传头像也能复用
})
export class UploadModule {}
