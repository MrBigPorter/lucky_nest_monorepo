import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permissions';

/**
 * 权限控制装饰器
 * @param module 业务模块 (OpModule)
 * @param action 具体动作 (OpAction)
 * @example @RequirePermission(OpModule.USER, OpAction.USER.VIEW)
 */
export const RequirePermission = (module: string, action: string) => {
  // 自动拼接成 "user_management:view_user" 这种格式
  const permissionString = `${module}:${action}`;
  return SetMetadata(PERMISSION_KEY, permissionString);
};
