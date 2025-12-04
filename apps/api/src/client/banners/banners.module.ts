import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { BannersController } from '@api/client/banners/banners.controller';
import { BannersService } from '@api/client/banners/banners.service';

@Module({
  imports: [PrismaModule],
  controllers: [BannersController],
  providers: [BannersService],
  exports: [],
})
export class BannersModule {}
