import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';

import { BizException } from '../exceptions/biz.exception';
import {CODE, MESSAGE} from '../error-codes.gen';

// 方便推断：所有合法 key 的联合类型（例如 'SYSTEM_ERROR' | 'PARAMETER_ERROR' | ...）
type CodeKey = keyof typeof CODE;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
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

        // —— 默认兜底：系统错误 —— //
        let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
        let code: number = CODE.SYSTEM_ERROR;
        let key: CodeKey = 'SYSTEM_ERROR';
        let message: string | undefined = MESSAGE[ 'SYSTEM_ERROR'];
        let details: unknown;

        // 业务异常：直接使用 BizException 内的 code/key
        if (exception instanceof BizException) {
            status = exception.getStatus?.() ?? HttpStatus.BAD_REQUEST;
            code = exception.code;
            key = exception.key as CodeKey;
            message = MESSAGE[key] ?? 'SYSTEM_ERROR';
            details = exception.extra;
        }

        // Nest 内置的 HttpException（含 class-validator 抛出的 400）
        else if (exception instanceof HttpException) {
            status = exception.getStatus();
            const body = exception.getResponse();
            const messages =
                body && typeof body === 'object' ? (body as any).message : undefined;
            details = messages;

            if (Array.isArray(messages)) {
                // 参数校验错误：返回字段错误明细
                code = CODE.PARAMETER_ERROR;

            } else {
                // 其它 HTTP 场景按需要专项映射（存在就用，不存在就保持 SYSTEM_ERROR）
                if (status === HttpStatus.TOO_MANY_REQUESTS && 'TOO_MANY_REQUESTS' in CODE) {
                    code = (CODE as any).TOO_MANY_REQUESTS;
                } else if (status === HttpStatus.UNAUTHORIZED && 'UNAUTHORIZED' in CODE) {
                    code = (CODE as any).UNAUTHORIZED;
                }
                // 其余保持默认 SYSTEM_ERROR，且不暴露 message，避免泄露内部信息
            }
        }

        // 其他非 HttpException 的运行时错误：保持默认 SYSTEM_ERROR，不透出 message
        // （日志里记录就好）

        const payload = {
            code,   // 数字码：埋点/排错
            message,
            tid,    // 请求追踪 ID
            data: null,
            ...(details ? { details } : {}),
        };

        httpAdapter.reply(res, payload, status);
    }
}