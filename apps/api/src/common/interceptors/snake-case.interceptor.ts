import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

// camelCase -> snake_case
function toSnake(str: string): string {
    return str
        .replace(/([A-Z]+)/g, '_$1') // UserID -> _User_ID
        .replace(/^_/, '')           // 开头多余 _
        .replace(/__/g, '_')         // 连续大写产生的 __ 合并
        .toLowerCase();
}

// snake_case -> camelCase
function toCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function isPlainObject(val: any): val is Record<string, any> {
    if (Object.prototype.toString.call(val) !== '[object Object]') return false;
    const proto = Object.getPrototypeOf(val);
    return proto === Object.prototype || proto === null;
}

// 响应标量规范化
function normalizeScalar(v: any) {
    if (typeof v === 'bigint') return v.toString();

    // Prisma Decimal、BN 一类
    if (v && typeof v === 'object' && typeof (v as any).valueOf === 'function') {
        const n = Number((v as any).valueOf());
        if (!Number.isNaN(n)) return n;
    }

    if (v instanceof Date) return v.toISOString(); // 或改 getTime()
    return v;
}

// 响应：deep camel -> snake
function deepSnake(obj: any): any {
    if (Array.isArray(obj)) return obj.map(deepSnake);

    if (isPlainObject(obj)) {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(obj)) {
            const key = /[A-Z]/.test(k) ? toSnake(k) : k; // 已是下划线的不动
            if (Array.isArray(v) || isPlainObject(v)) out[key] = deepSnake(v);
            else out[key] = normalizeScalar(v);
        }
        return out;
    }

    return normalizeScalar(obj);
}

// 请求：deep snake -> camel（保留原值）
function deepCamel(obj: any): any {
    if (Array.isArray(obj)) return obj.map(deepCamel);

    if (isPlainObject(obj)) {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(obj)) {
            const key = k.includes('_') ? toCamel(k) : k;
            if (Array.isArray(v) || isPlainObject(v)) out[key] = deepCamel(v);
            else out[key] = v;
        }
        return out;
    }

    return obj;
}

@Injectable()
export class CamelSnakeInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const httpCtx = context.switchToHttp();
        const req = httpCtx.getRequest();

        try {
            // body：一般是普通对象，可以直接替换（稳一点也可以用 mutate）
            if (req.body && typeof req.body === 'object') {
                req.body = deepCamel(req.body);
            }

            // query：属性是只读的，不能 req.query = ...
            if (req.query && typeof req.query === 'object') {
                const camelQuery = deepCamel(req.query);

                // 先清空原来的，再拷贝新值
                Object.keys(req.query).forEach((k) => delete (req.query as any)[k]);
                Object.assign(req.query, camelQuery);
            }

            // params：有些平台也是 getter，按同样方式处理比较保险
            if (req.params && typeof req.params === 'object') {
                const camelParams = deepCamel(req.params);
                Object.keys(req.params).forEach((k) => delete (req.params as any)[k]);
                Object.assign(req.params, camelParams);
            }
        } catch (e) {
            console.error('CamelSnakeInterceptor request transform error:', e);
        }

        // 出去的：保持你现在的写法
        return next.handle().pipe(
            map((data) => {
                try {
                    return deepSnake(data);
                } catch (e) {
                    console.error('CamelSnakeInterceptor response transform error:', e);
                    return data;
                }
            }),
        );
    }
}