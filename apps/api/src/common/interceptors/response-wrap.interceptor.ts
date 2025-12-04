import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { randomUUID } from 'node:crypto';
import { Reflector } from '@nestjs/core';
import { SKIP_WRAP } from '@api/common/decorators/skip-wrap.decorator';

@Injectable()
export class ResponseWrapInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_WRAP, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) return next.handle();

    const req = context.switchToHttp().getRequest();
    const reqId = (req?.id ?? req?.headers?.['x-request-id']) as
      | string
      | undefined;

    const makeTid = () =>
      reqId ? String(reqId) : randomUUID().replace(/-/g, '');

    return next.handle().pipe(
      map((data) => {
        // 已经是包壳就别重复包
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          'data' in data
        ) {
          return data;
        }
        // 原样透传流/Buffer等场景可在这里判断后直接 return data（如需）
        return {
          code: 10000,
          message: 'success',
          tid: makeTid(),
          data,
        };
      }),
    );
  }
}
