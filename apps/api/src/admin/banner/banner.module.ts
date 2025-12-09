import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { BannerController } from '@api/admin/banner/banner.controller';
import { BannerService } from '@api/admin/banner/banner.service';

@Module({
  imports: [PrismaModule],
  controllers: [BannerController],
  providers: [BannerService],
  exports: [],
})
export class BannerModule {}
