import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { randomUUID } from 'node:crypto';

@Injectable()
export class ResponseWrapInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const reqId = (req?.id ?? req?.headers?.['x-request-id']) as string | undefined;

        const makeTid = () => (reqId ? String(reqId) : randomUUID().replace(/-/g, ''));

        return next.handle().pipe(
            map((data) => {
                console.log('data===>', data);
                // 已经是包壳就别重复包
                if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
                    return data;
                }
                // 原样透传流/Buffer等场景可在这里判断后直接 return data（如需）
                return {
                    code: 10000,
                    message: 'SUCCESS',
                    tid: makeTid(),
                    data,
                };
            }),
        );
    }
}