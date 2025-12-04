import { Module } from '@nestjs/common';
import { AdsController } from '@api/client/ads/ads.controller';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { AdsService } from '@api/client/ads/ads.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [],
})
export class AdsModule {}
