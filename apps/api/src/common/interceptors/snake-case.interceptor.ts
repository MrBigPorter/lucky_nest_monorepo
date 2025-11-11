import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

// 简单且鲁棒的 snake_case 转换
function toSnake(str: string): string {
    return str
        .replace(/([A-Z]+)/g, '_$1')       // UserID -> _User_ID
        .replace(/^_/, '')                  // 开头多余的 _
        .replace(/__/g, '_')                // 连续大写产生的 __ 合并
        .toLowerCase();
}

function isPlainObject(val: any): val is Record<string, any> {
    if (Object.prototype.toString.call(val) !== '[object Object]') return false;
    const proto = Object.getPrototypeOf(val);
    return proto === Object.prototype || proto === null;
}

// 避免 JSON 序列化崩掉，做一些常见类型的格式化
function normalizeScalar(v: any) {
    // Prisma Decimal、BigInt 等都先尝试转 number 或 string
    if (typeof v === 'bigint') return v.toString();
    // Decimal、BN 类对象常见有 valueOf
    if (v && typeof v === 'object' && typeof (v as any).valueOf === 'function') {
        const n = Number((v as any).valueOf());
        if (!Number.isNaN(n)) return n;
    }
    if (v instanceof Date) return v.toISOString(); // 或者改成 v.getTime()
    return v;
}

function deepSnake(obj: any): any {
    if (Array.isArray(obj)) return obj.map(deepSnake);
    if (isPlainObject(obj)) {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(obj)) {
            const key = /[A-Z]/.test(k) ? toSnake(k) : k; // 已经是下划线的，不动
            if (Array.isArray(v) || isPlainObject(v)) out[key] = deepSnake(v);
            else out[key] = normalizeScalar(v);
        }
        return out;
    }
    return normalizeScalar(obj);
}

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(map((data) => deepSnake(data)));
    }
}