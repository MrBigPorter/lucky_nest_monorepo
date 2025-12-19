import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { KycController } from '@api/admin/kyc/kyc.controller';
import { KycService } from '@api/admin/kyc/kyc.service';

@Module({
  imports: [PrismaModule],
  controllers: [KycController],
  providers: [KycService],
  exports: [],
})
export class KycModule {}
