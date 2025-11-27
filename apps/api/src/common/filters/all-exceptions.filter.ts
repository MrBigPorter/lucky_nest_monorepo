import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';

import { BizException } from '../exceptions/biz.exception';
import { CODE, MESSAGE } from '../error-codes.gen';

type CodeKey = keyof typeof CODE;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(private readonly adapterHost: HttpAdapterHost) {}

    catch(exception: unknown, host: ArgumentsHost) {
        const { httpAdapter } = this.adapterHost;
        const ctx = host.switchToHttp();

        const req = ctx.getRequest<Request & { id?: string }>();
        const res = ctx.getResponse();

        const reqId =
            (req?.id as string | undefined) ||
            (req?.headers?.['x-request-id'] as string | undefined);

        const tid = (reqId ?? randomUUID().replaceAll('-', ''));

        // ---- 默认兜底：系统错误 ---- //
        let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
        let code: number = CODE.SYSTEM_ERROR;
        let key: CodeKey = 'SYSTEM_ERROR';
        let message: string | undefined = MESSAGE[key];
        let details: unknown;

        // ---------- 业务异常：BizException ---------- //
        if (exception instanceof BizException) {
            status = exception.getStatus?.() ?? HttpStatus.BAD_REQUEST;
            code = exception.code;
            key = exception.key as CodeKey;
            message = MESSAGE[key];
            details = exception.extra;

            this.logger.error(
                `BizException caught: tid=${tid}, path=${req.method} ${req.url}, ` +
                `status=${status}, code=${code}, key=${key}, message=${message}, ` +
                `details=${JSON.stringify(details)}`,
            );
        }

        // ---------- Nest 内置 HttpException（包含 class-validator 的 400） ---------- //
        else if (exception instanceof HttpException) {
            status = exception.getStatus();
            const body = exception.getResponse();

            // 可能是字符串 / 对象 / 数组
            let rawMessage: any;
            if (typeof body === 'string') {
                rawMessage = body;
            } else if (body && typeof body === 'object') {
                rawMessage = (body as any).message ?? (body as any).error;
            }

            // 默认用 HTTP 状态码作为错误码
            code = status;

            if (Array.isArray(rawMessage)) {
                // 这是 class-validator 的错误数组
                key = 'PARAMETER_ERROR' as CodeKey;
                code = CODE.PARAMETER_ERROR;
                message = rawMessage.join('; ');
                details = rawMessage;
            } else {
                // 其他 HTTP 异常（比如手动 throw new BadRequestException('xxx')）
                message = rawMessage ?? MESSAGE[key];

                // 根据状态码做一些常用映射
                if (status === HttpStatus.TOO_MANY_REQUESTS && 'TOO_MANY_REQUESTS' in CODE) {
                    key = 'TOO_MANY_REQUESTS' as CodeKey;
                    code = (CODE as any).TOO_MANY_REQUESTS;
                } else if (status === HttpStatus.UNAUTHORIZED && 'UNAUTHORIZED' in CODE) {
                    key = 'UNAUTHORIZED' as CodeKey;
                    code = (CODE as any).UNAUTHORIZED;
                }
            }

            this.logger.error(
                `HttpException caught: tid=${tid}, path=${req.method} ${req.url}, ` +
                `status=${status}, code=${code}, key=${key}, message=${message}, ` +
                `response=${JSON.stringify(body)}`,
                (exception as any).stack,
            );
        }

        // ---------- 未知异常：直接当系统错误 ---------- //
        else {
            this.logger.error(
                `Unknown exception caught: tid=${tid}, path=${req.method} ${req.url}, ` +
                `error=${(exception as any)?.message ?? exception}`,
                (exception as any)?.stack,
            );
        }

        const payload = {
            code,
            message,
            tid,
            data: null,
             details,
        };

        httpAdapter.reply(res, payload, status);
    }
}