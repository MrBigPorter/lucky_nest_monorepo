import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    //  核心修复：如果是游客，request.user 是 undefined
    // 我们直接返回 null，防止代码崩溃
    if (!request.user) {
      return null;
    }

    // 如果指定了字段，返回指定字段
    if (data) {
      return request.user[data as string];
    }

    // 默认返回 userId
    return request.user.userId;
  },
);
