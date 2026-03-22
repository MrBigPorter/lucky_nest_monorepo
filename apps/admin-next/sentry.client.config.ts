/**
 * Sentry 客户端配置 — 浏览器端
 * Sentry client config — runs in the browser
 *
 * 这个文件在用户浏览器里执行，捕获：
 *   - 前端 JS 报错（TypeError / ReferenceError 等）
 *   - React 组件未捕获的异常
 *   - 手动 Sentry.captureException() 上报
 *
 * This file runs in the browser and captures:
 *   - Frontend JS errors
 *   - Uncaught React component exceptions
 *   - Manual Sentry.captureException() calls
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  /**
   * DSN（Data Source Name）：告诉 SDK 把事件发到哪个 Sentry 项目。
   * DSN: tells the SDK where to send events (which Sentry project).
   *
   * 这是公开值，前端代码可见，不需要保密。
   * This is a public value, visible in frontend code, not a secret.
   *
   * 在 .env.production 里设置：
   * Set in .env.production:
   *   NEXT_PUBLIC_SENTRY_DSN=https://xxx@ooo.ingest.sentry.io/yyy
   */
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  /**
   * 环境标签 — 区分生产和开发的事件。
   * Environment label — distinguishes production vs dev events.
   */
  environment: process.env.NODE_ENV,

  /**
   * 性能追踪采样率：10% 的页面访问会被记录性能事务。
   * Performance tracing sample rate: 10% of page visits record a performance transaction.
   *
   * 为什么 0.1 而不是更高？
   * Why 0.1 and not higher?
   *   Admin 后台每天约 50 次访问 × 10% = 5 次性能事务
   *   免费额度 10,000 次/月，2000 天才会超，绝对够用。
   *
   * Admin panel ~50 page visits/day × 10% = 5 perf transactions/day.
   * Free tier: 10,000/month — 2000 days before exceeding. More than enough.
   */
  tracesSampleRate: 0.1,

  /**
   * Session Replay 关闭。
   * Session Replay disabled.
   *
   * Session Replay 会录制用户操作（鼠标移动/点击），对 Admin 没价值且消耗额度。
   * Session Replay records mouse movements/clicks — no value for admin, wastes quota.
   */
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  /**
   * 开发模式禁用 — 避免开发时污染 Sentry 的生产数据。
   * Disabled in development — prevents dev noise in production Sentry project.
   *
   * enabled: false 时 SDK 仍然初始化，只是不发送事件。
   * When enabled: false, SDK initializes but sends nothing.
   */
  enabled: process.env.NODE_ENV === 'production',

  /**
   * 忽略的报错类型 — 减少无意义的噪音事件。
   * Ignored error patterns — reduce meaningless noise.
   *
   * ResizeObserver loop error: 浏览器内置组件的良性警告，不影响功能。
   * Network Error / Failed to fetch: 网络抖动，不是代码 bug。
   */
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Network Error',
    'Failed to fetch',
    /^AbortError/,
  ],
});
