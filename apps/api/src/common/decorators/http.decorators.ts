import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getRealIp, getUserAgent } from '@api/common/utils/request.util';

// get real ip from request
export const ReaIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return getRealIp(req);
  },
);

// get user agent from request
export const UserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return getUserAgent(req);
  },
);
