import { Module } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';
import { RedisModule } from '@api/common/redis/redis.module';

@Module({
  imports: [RedisModule, RedisModule],
  controllers: [SectionsController],
  providers: [SectionsService],
})
export class SectionsModule {}
