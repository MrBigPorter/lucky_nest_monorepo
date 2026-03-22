/**
 * Sentry 服务端配置 — Node.js 运行时
 * Sentry server config — runs in Node.js runtime
 *
 * 这个文件在 Next.js 服务器端（Node.js）执行，捕获：
 *   - async Server Component 里的异常
 *   - Route Handler（API Route）里的异常
 *   - Server Action 里的异常
 *
 * This file runs on the Next.js server (Node.js) and captures:
 *   - async Server Component exceptions
 *   - Route Handler (API Route) exceptions
 *   - Server Action exceptions
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  /**
   * 服务端性能追踪采样率。
   * Server-side performance tracing sample rate.
   *
   * 服务端事务包含 serverGet() 调用时间、数据库查询时间等，
   * 可以发现服务端慢请求。
   * Server transactions include serverGet() duration, DB query time, etc.
   * Useful for finding slow server-side requests.
   */
  tracesSampleRate: 0.1,

  enabled: process.env.NODE_ENV === 'production',

  /**
   * 忽略预期内的 4xx 错误 — 避免正常的权限拒绝/未找到事件刷屏。
   * Ignore expected 4xx errors — auth failures and not-found are expected.
   */
  ignoreErrors: [/^NotFoundError/, /^UnauthorizedError/],
});
