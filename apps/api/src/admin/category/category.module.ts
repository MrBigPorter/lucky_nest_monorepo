import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { CategoryService } from '@api/admin/category/category.service';
import { CategoryController } from '@api/admin/category/category.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
