import { Module } from '@nestjs/common';
import { LuckyDrawModule } from '@api/common/lucky-draw/lucky-draw.module';
import { ClientLuckyDrawController } from './lucky-draw.controller';

@Module({
  imports: [LuckyDrawModule],
  controllers: [ClientLuckyDrawController],
})
export class ClientLuckyDrawModule {}
