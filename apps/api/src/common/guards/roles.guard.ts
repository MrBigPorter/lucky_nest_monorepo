import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '@api/common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 1. 获取路由上的 @Roles 标签内容
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. 如果没加 @Roles 标签，说明不需要特定权限，直接放行
    if (!requiredRoles) {
      return true;
    }

    // 3. 获取 Request 对象（JwtAuthGuard 已经把 user 挂载上去了)
    const { user } = context.switchToHttp().getRequest();

    // 4. 防御性检查
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: No role assigned');
    }

    // 5. 核心逻辑：判断用户的角色是否在允许的角色列表中
    // 假设 user.role 是字符串 (如 'ADMIN')
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException('Access denied: Insufficient permissions');
    }
    return true;
  }
}
