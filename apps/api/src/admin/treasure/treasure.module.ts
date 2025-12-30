import { Module } from '@nestjs/common';
import { TreasureController } from '@api/admin/treasure/treasure.controller';
import { TreasureService } from '@api/admin/treasure/treasure.service';
import { RedisModule } from '@api/common/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [TreasureController],
  providers: [TreasureService],
})
export class TreasureModule {}
