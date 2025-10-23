
export interface ApiBae {
    code: number;
    message: string;
    tid: string;
}

export interface ApiSuccess<T> extends ApiBae {
    data: T;
}

export interface ApiError extends ApiBae {
    data?: never;
}

export function ok<T>(data: T, message = 'success', tid?:string): ApiSuccess<T> {
    return { code: 10000, message, tid:tid ?? '', data };
}

export function fail(code: number, message: string, tid?: string ){
    return { code, message, tid: tid ?? null, data: null };
}