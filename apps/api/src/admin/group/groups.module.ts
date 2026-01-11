import { Module } from '@nestjs/common';
import { GroupModule } from '@api/common/group/group.module';
import { GroupController } from '@api/admin/group/group.controller';

@Module({
  imports: [GroupModule],
  controllers: [GroupController],
  providers: [],
  exports: [],
})
export class GroupAdminModule {}
