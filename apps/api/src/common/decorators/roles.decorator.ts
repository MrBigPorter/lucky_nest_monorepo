import { SetMetadata } from '@nestjs/common';
import { Role } from '@lucky/shared';

// 定义 Metadata 的 Key，方便 Guard 读取
export const ROLES_KEY = 'roles';

// 装饰器函数：接收一组允许的角色
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
