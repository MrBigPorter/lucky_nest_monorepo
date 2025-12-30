import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response } from 'express';

@Injectable()
export class ServerTimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Response>();
        // 在响应头中添加服务器时间
        // x-server-time 是自定义头，前端以此为准
        response.setHeader('x-server-time', Date.now().toString());
      }),
    );
  }
}
