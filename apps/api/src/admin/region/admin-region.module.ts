import { Module } from '@nestjs/common';
import { RegionModule } from '@api/common/region/region.module';
import { AdminRegionController } from '@api/admin/region/admin-region.controller';

@Module({
  imports: [RegionModule],
  controllers: [AdminRegionController],
  providers: [],
  exports: [],
})
export class AdminRegionModule {}
