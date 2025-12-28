import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { KycController } from '@api/admin/kyc/kyc.controller';
import { KycService } from '@api/admin/kyc/kyc.service';
import { UploadModule } from '@api/common/upload/upload.module';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [KycController],
  providers: [KycService],
  exports: [],
})
export class KycModule {}
