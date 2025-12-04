import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/prisma/prisma.module';
import { BannersController } from '@api/banners/banners.controller';
import { BannersService } from '@api/banners/banners.service';

@Module({
  imports: [PrismaModule],
  controllers: [BannersController],
  providers: [BannersService],
  exports: [],
})
export class BannersModule {}
