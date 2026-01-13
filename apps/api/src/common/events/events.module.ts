import { Module, Global } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Global() //  关键：设为全局，这样 GroupModule 不用 import 也能注入 Gateway
@Module({
  providers: [EventsGateway],
  exports: [EventsGateway], // 导出给别人用
})
export class EventsModule {}
