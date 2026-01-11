import { Module } from '@nestjs/common';
import { GroupModule } from '@api/common/group/group.module';
import { GroupClientController } from '@api/client/group/group.controller';

@Module({
  imports: [GroupModule],
  controllers: [GroupClientController],
  providers: [],
  exports: [],
})
export class GroupClientModule {}
