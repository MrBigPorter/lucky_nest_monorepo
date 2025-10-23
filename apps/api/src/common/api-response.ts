import {randomUUID} from "node:crypto";

export type ApiOk<T> = {
    code: number; message: string; tid: string; data: T;
}


export function ok<T>(data: T, message = 'success'): ApiOk<T> {
    return { code: 10000, message, tid: randomUUID().replaceAll('-', ''), data };
}

export function fail(code: 10001, message: string){
    return { code, message, tid: randomUUID().replaceAll('-', ''), data: null };
}