import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

/**
 * Admin JWT Auth Guard
 * 验证 Admin token（用 ADMIN_JWT_SECRET 或 JWT_SECRET 签发）
 * 不注入 JwtService，直接使用 jsonwebtoken，避免每个模块都要 import JwtModule
 */
@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No admin token provided');
    }

    const secret =
      process.env.ADMIN_JWT_SECRET ||
      process.env.JWT_SECRET ||
      'please_change_me_very_secret';

    try {
      const payload = jwt.verify(token, secret) as any;
      // 挂载到 request.user，供 @CurrentUserId 等 decorator 使用
      request.user = {
        id: payload.sub,
        userId: payload.sub,
        role: payload.role,
        type: payload.type,
        username: payload.username,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired admin token');
    }

    return true;
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return null;
  }
}

