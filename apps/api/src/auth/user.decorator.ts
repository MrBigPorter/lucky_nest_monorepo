import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// get current user id
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.userId; // JwtStrategy.validate 返回的
  },
);
