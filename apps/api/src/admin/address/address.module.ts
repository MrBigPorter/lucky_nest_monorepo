import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { AddressController } from '@api/admin/address/address.controller';
import { AddressService } from '@api/admin/address/address.service';
import { RegionModule } from '@api/common/region/region.module';

@Module({
  imports: [PrismaModule, RegionModule],
  controllers: [AddressController],
  providers: [AddressService],
})
export class AddressModule {}
