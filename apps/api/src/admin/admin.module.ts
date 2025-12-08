import { Module } from '@nestjs/common';
import { AuthModule } from '@api/admin/auth/auth.module';
import { UserModule } from '@api/admin/user/user.module';
import { CategoryModule } from '@api/admin/category/category.module';
import { TreasureModule } from '@api/admin/treasure/treasure.module';
import { ActSectionModule } from '@api/admin/act-section/act-section.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    CategoryModule,
    TreasureModule,
    ActSectionModule,
  ],
  providers: [],
  controllers: [],
})
export class AdminModule {}
