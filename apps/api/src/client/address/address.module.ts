import { Module } from '@nestjs/common';
import { AddressController } from '@api/client/address/address.controller';
import { AddressService } from '@api/client/address/address.service';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { RegionModule } from '@api/common/region/region.module';

@Module({
  imports: [PrismaModule, RegionModule],
  controllers: [AddressController],
  providers: [AddressService],
})
export class AddressModule {}
