import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { KycController } from '@api/client/kyc/kyc.controller';
import { KycService } from '@api/client/kyc/kyc.service';
import { UploadModule } from '@api/common/upload/upload.module';
import { KycProviderService } from '@api/common/kyc-provider/kyc-provider.service';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [KycController],
  providers: [KycService, KycProviderService],
  exports: [],
})
export class KycModule {}
