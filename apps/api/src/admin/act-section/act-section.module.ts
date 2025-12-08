import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { ActSectionController } from '@api/admin/act-section/act-section.controller';
import { ActSectionService } from '@api/admin/act-section/act-section.service';

@Module({
  imports: [PrismaModule],
  controllers: [ActSectionController],
  providers: [ActSectionService],
  exports: [],
})
export class ActSectionModule {}
