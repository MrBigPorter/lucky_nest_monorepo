import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware — only active in dev (Next.js server mode).
 * In production (output: 'export'), middleware is NOT executed.
 * Auth protection is handled client-side in:
 *   - DashboardLayout (protected pages)
 *   - Login view (redirect if already authenticated)
 */

const PUBLIC_PATHS = ['/login'];

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

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // 未登录 → 跳登录页
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 已登录访问登录页 → 跳首页
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
