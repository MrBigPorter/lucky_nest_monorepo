import { Module } from '@nestjs/common';
import { TreasureController } from '@api/admin/treasure/treasure.controller';
import { TreasureService } from '@api/admin/treasure/treasure.service';

@Module({
  controllers: [TreasureController],
  providers: [TreasureService],
})
export class TreasureModule {}
