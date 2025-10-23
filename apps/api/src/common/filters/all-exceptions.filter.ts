import {
    ArgumentsHost, Catch, ExceptionFilter,  HttpException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {HttpAdapterHost} from "@nestjs/core";

// 统一异常过滤器
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly adapterHost: HttpAdapterHost) {}

    catch(exception: unknown, host: ArgumentsHost) {
        const { httpAdapter } = this.adapterHost;
        const ctx = host.switchToHttp();

        const req: any = ctx.getRequest();
        const res = ctx.getResponse();

        const tid = req?.id || randomUUID().replaceAll('-', '');

        let status = 500;
        let message: string | string[] = 'Internal server error';
        let details: any = undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const body = exception.getResponse();
            if (typeof body === 'string') {
                message = body;
            } else if (body && typeof body === 'object') {
                const msg = (body as any).message;
                message = msg ?? (body as any).error ?? message;
                // class-validator 的 message 可能是数组，这里透到 details
                if (Array.isArray(msg)) details = msg;
            }
        } else if (exception instanceof Error) {
            message = exception.message || message;
        }

        const payload = {
            code: 10001,
            message,
            tid,
            data: null,
            ...(details ? { details } : {}),
        };

        httpAdapter.reply(res, payload, status);
    }
}