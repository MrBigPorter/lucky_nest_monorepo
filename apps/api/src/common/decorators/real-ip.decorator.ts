import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RealIP = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    // 1. 优先尝试从 X-Forwarded-For 获取 (Nginx/CDN 标准)
    // 格式通常是: "client_ip, proxy1_ip, proxy2_ip"
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      // 取逗号前的第一个 IP，就是真实用户 IP
      const ips = Array.isArray(xForwardedFor)
        ? xForwardedFor
        : xForwardedFor.split(',');
      return ips[0].trim();
    }

    // 2. 尝试 X-Real-IP (部分 Nginx 配置使用此 Header)
    if (req.headers['x-real-ip']) {
      return Array.isArray(req.headers['x-real-ip'])
        ? req.headers['x-real-ip'][0]
        : req.headers['x-real-ip'];
    }

    // 3. 最后回退到连接 IP (本地开发时通常是 127.0.0.1 或 ::1)
    return req.ip || req.connection.remoteAddress || '0.0.0.0';
  },
);
