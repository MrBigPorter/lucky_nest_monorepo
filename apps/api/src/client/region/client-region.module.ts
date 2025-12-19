import { Module } from '@nestjs/common';
import { RegionModule } from '@api/common/region/region.module';
import { ClientRegionController } from '@api/client/region/client-region.controller';

@Module({
  imports: [RegionModule],
  controllers: [ClientRegionController],
  providers: [],
})
export class ClientRegionModule {}
