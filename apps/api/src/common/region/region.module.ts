import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { RegionService } from '@api/common/region/region.service';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [RegionService],
  exports: [RegionService],
})
export class RegionModule {}
