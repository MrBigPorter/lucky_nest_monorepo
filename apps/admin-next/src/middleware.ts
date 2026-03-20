import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware — 在 dev 和 production 均生效（output: 'standalone' 模式支持 Node.js middleware）。
 * 职责: 服务端路由守卫，读取 Cookie 中的 auth_token 判断是否已登录。
 *   - 未登录访问受保护页面 → 302 跳转 /login
 *   - 已登录访问 /login → 302 跳转 /（防止重复登录）
 * 注: 静态资源（/_next/*、favicon 等）直接放行，不走认证逻辑。
 */

const PUBLIC_PATHS = ['/login', '/register-apply', '/privacy-policy'];

function isExactOrSubPath(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过静态资源
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('x-auth-token');

  const isPublicPath = PUBLIC_PATHS.some((p) => isExactOrSubPath(pathname, p));

  // 未登录 → 跳登录页
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 已登录访问登录页 → 跳首页
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const response = NextResponse.next();
  // 把当前 pathname 写入 response header，供 (dashboard)/layout.tsx 的
  // generateMetadata 读取，避免在每个 page 单独写 metadata
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
