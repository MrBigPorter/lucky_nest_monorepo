import { HttpException } from '@nestjs/common';
import {
  CODE,
  type CodeKey,
  type CodeValue,
} from '@api/common/error-codes.gen';

// 定义后端统一异常 defined backend unified exception
export class BizException extends HttpException {
  constructor(
    public readonly code: number,
    public readonly key: CodeKey,
    httpStatus = 400,
    public readonly extra?: unknown,
  ) {
    super(key, httpStatus);
  }
}

// 便捷函数：按 key 抛业务异常 easiest way to throw biz exception
export const throwBiz = (
  key: CodeKey,
  httpStatus = 400,
  extra?: unknown,
): never => {
  const code = CODE[key] as CodeValue;
  throw new BizException(code, key, httpStatus, extra);
};
