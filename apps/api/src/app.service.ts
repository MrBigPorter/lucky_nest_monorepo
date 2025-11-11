import { Injectable } from '@nestjs/common';

// Service 用 @Injectable() 标记
// 可被注入到 Controller（constructor(private svc: UsersService){}）
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
