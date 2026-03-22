/**
 * Sentry 客户端 Instrumentation — 浏览器端初始化入口
 * Sentry client instrumentation — browser-side init entry point
 *
 * Next.js 15 会在浏览器端自动执行这个文件（非 React 组件，纯 JS 入口）。
 * Next.js 15 auto-executes this file in the browser (not a React component, plain JS entry).
 *
 * onRouterTransitionStart hook 是 Next.js 15 专属，sentry.client.config.ts 不支持。
 * onRouterTransitionStart hook is Next.js 15 exclusive; sentry.client.config.ts doesn't support it.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  /**
   * DSN 通过环境变量注入，不硬编码。
   * DSN is injected via env var, not hardcoded.
   * 设置：.env.production → NEXT_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
   */
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Session Replay：录制用户操作，帮助复现 Bug / Records user interactions to reproduce bugs
  integrations: [Sentry.replayIntegration()],

  // 性能追踪采样率：生产 10%，开发 100% / Perf trace sample rate: 10% prod, 100% dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 正常 Session 录制概率 10% / 10% chance of recording normal sessions
  replaysSessionSampleRate: 0.1,

  // 发生错误时录制概率 100% / 100% chance of recording when error occurs
  replaysOnErrorSampleRate: 1.0,

  // 允许发送用户标识（Admin 已登录用户，可追踪错误到操作人）
  // Allow sending user PII (Admin users — trace errors to specific operators)
  sendDefaultPii: true,
});

/**
 * 路由切换性能追踪钩子 — 每次 Next.js 导航自动记录 trace
 * Router transition performance hook — auto-records trace on every navigation
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
