/**
 * Sentry 客户端 Instrumentation — 浏览器端初始化入口
 * Sentry client instrumentation — browser-side init entry point
 *
 * Next.js 15 会在浏览器端自动执行这个文件（非 React 组件，纯 JS 入口）。
 * Next.js 15 auto-executes this file in the browser (not a React component, plain JS entry).
 *
 * 当前策略：仅保留核心报错上报，关闭性能追踪和录屏，优先控制 Cloudflare 体积。
 * Current strategy: keep core error reporting only; disable tracing/replay to reduce Cloudflare bundle cost.
 */
import * as Sentry from '@sentry/browser';

Sentry.init({
  /**
   * DSN 通过环境变量注入，不硬编码。
   * DSN is injected via env var, not hardcoded.
   * 设置：.env.production → NEXT_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
   */
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: process.env.NODE_ENV === 'production',

  // Error-only mode: do not attach user PII by default.
  sendDefaultPii: false,

  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Network Error',
    'Failed to fetch',
    /^AbortError/,
  ],
});
