/**
 * Sentry Edge Runtime 配置 — Middleware 层
 * Sentry edge config — runs in Edge Runtime (middleware)
 *
 * 这个文件在 Next.js middleware（Edge Runtime）里执行。
 * Edge Runtime 是轻量级 V8 环境，不是完整 Node.js，
 * 因此 SDK 功能受限（无 Session Replay / 无 Profiling）。
 *
 * This file runs in Next.js middleware (Edge Runtime).
 * Edge Runtime is a lightweight V8 environment, not full Node.js,
 * so SDK features are limited.
 *
 * 主要捕获：middleware.ts 里的路由鉴权异常。
 * Primarily captures: auth exceptions in middleware.ts routing guard.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  /**
   * Edge 层事务采样率设为 0 — middleware 是每个请求都会跑的，
   * 采样太高会快速消耗额度。
   * Edge transaction sample rate = 0 — middleware runs on every request,
   * sampling too high burns quota fast.
   */
  tracesSampleRate: 0,

  enabled: process.env.NODE_ENV === 'production',
});
