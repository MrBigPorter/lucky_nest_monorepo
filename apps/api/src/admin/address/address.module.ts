import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { AddressController } from '@api/admin/address/address.controller';
import { AddressService } from '@api/admin/address/address.service';

@Module({
  imports: [PrismaModule],
  controllers: [AddressController],
  providers: [AddressService],
})
export class AddressModule {}
