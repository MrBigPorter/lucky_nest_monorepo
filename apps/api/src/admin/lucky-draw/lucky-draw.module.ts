import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { AdminLuckyDrawController } from './lucky-draw.controller';
import { AdminLuckyDrawService } from './lucky-draw.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminLuckyDrawController],
  providers: [AdminLuckyDrawService],
})
export class AdminLuckyDrawModule {}
