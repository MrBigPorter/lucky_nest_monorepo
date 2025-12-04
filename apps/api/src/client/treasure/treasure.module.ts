import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { TreasureController } from '@api/client/treasure/treasure.controller';
import { TreasureService } from '@api/client/treasure/treasure.service';

@Module({
  imports: [PrismaModule],
  controllers: [TreasureController],
  providers: [TreasureService],
})
export class TreasureModule {}
