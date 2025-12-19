import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { KycController } from '@api/client/kyc/kyc.controller';
import { KycService } from '@api/client/kyc/kyc.service';

@Module({
  imports: [PrismaModule],
  controllers: [KycController],
  providers: [KycService],
  exports: [],
})
export class KycModule {}
