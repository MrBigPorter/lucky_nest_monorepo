import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
//请求 ID 中间件（或函数）
export function requestId() {
  return (
    req: Request & { id?: string },
    res: Response,
    next: NextFunction,
  ) => {
    const fromHeader = req.headers['x-request-id'];
    const id =
      (Array.isArray(fromHeader) ? fromHeader[0] : fromHeader)?.toString() ||
      randomUUID().replaceAll('-', '');
    req.id = id;
    res.setHeader('x-request-id', id);
    next();
  };
}
