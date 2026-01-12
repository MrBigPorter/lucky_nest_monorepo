import { Module } from '@nestjs/common';
import { GroupModule } from '@api/common/group/group.module';
import { GroupClientController } from '@api/client/group/group.controller';
import { GroupProcessor } from '@api/common/group/processors/group.processor';
import { WalletModule } from '@api/client/wallet/wallet.module';

@Module({
  imports: [GroupModule, WalletModule],
  controllers: [GroupClientController],
  providers: [GroupProcessor],
  exports: [],
})
export class GroupClientModule {}
