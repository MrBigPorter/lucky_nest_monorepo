import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// 扩展 Request 类型以包含 session
interface RequestWithSession extends Request {
  session?: {
    [key: string]: any;
  };
}

/**
 * CSRF 保护中间件
 * 验证请求中的 CSRF Token 是否有效
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: RequestWithSession, res: Response, next: NextFunction) {
    // 只对 POST, PUT, PATCH, DELETE 请求进行 CSRF 验证
    const method = req.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next();
    }

    // 跳过不需要 CSRF 保护的路由
    const skipRoutes = [
      '/api/v1/auth/admin/login',
      '/api/v1/auth/admin/refresh',
      '/api/v1/auth/admin/set-cookie',
      '/api/v1/auth/admin/clear-cookie',
      '/api/health',
      // 跳过所有客户端API路由（Flutter应用）
      '/api/v1/client/',
      // 跳过支付回调路由
      '/api/v1/payment/',
      // 跳过webhook路由
      '/api/v1/webhook/',
    ];

    if (skipRoutes.some((route) => req.path.startsWith(route))) {
      return next();
    }

    // 从请求头或请求体中获取 CSRF Token
    const csrfToken =
      (req.headers['x-csrf-token'] as string) ||
      (req.headers['x-xsrf-token'] as string) ||
      req.body?._csrf;

    if (!csrfToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    // 验证 CSRF Token 格式（64位十六进制字符）
    if (!/^[a-f0-9]{64}$/i.test(csrfToken)) {
      throw new ForbiddenException('Invalid CSRF token format');
    }

    // 从 cookie 或 session 中获取存储的 CSRF Token
    const storedToken =
      req.cookies?.['csrf_token'] || req.session?.['csrf_token'];

    if (!storedToken) {
      throw new ForbiddenException('No CSRF token found in session');
    }

    // 验证 Token 是否匹配
    if (csrfToken !== storedToken) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    // 验证通过，继续处理请求
    next();
  }
}

/**
 * CSRF Token 生成中间件
 * 为每个会话生成 CSRF Token
 */
@Injectable()
export class CsrfTokenMiddleware implements NestMiddleware {
  use(req: RequestWithSession, res: Response, next: NextFunction) {
    // 只对 GET 请求生成 CSRF Token
    if (req.method.toUpperCase() !== 'GET') {
      return next();
    }

    // 检查是否已有 CSRF Token
    let csrfToken = req.cookies?.['csrf_token'] || req.session?.['csrf_token'];

    if (!csrfToken) {
      // 生成新的 CSRF Token
      csrfToken = this.generateCsrfToken();

      // 设置到 cookie 中
      res.cookie('csrf_token', csrfToken, {
        httpOnly: false, // 前端需要读取
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24小时
      });

      // 也存储到 session 中
      if (req.session) {
        req.session['csrf_token'] = csrfToken;
      }
    }

    // 将 Token 添加到响应头中，方便前端获取
    res.setHeader('X-CSRF-Token', csrfToken);

    next();
  }

  private generateCsrfToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      '',
    );
  }
}
