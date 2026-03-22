/**
 * Next.js Instrumentation — 服务端初始化钩子
 * Next.js Instrumentation — server-side lifecycle hook
 *
 * 这个文件是 Next.js 15 的标准钩子，在服务器启动时执行一次。
 * 用于初始化需要在第一次请求前就准备好的服务（如监控 SDK）。
 *
 * This file is a standard Next.js 15 hook, executed once on server startup.
 * Used to initialize services that must be ready before the first request (e.g. monitoring SDKs).
 *
 * 为什么不在 _app.tsx 里初始化 Sentry？
 * Why not initialize Sentry in _app.tsx?
 *   App Router 没有 _app.tsx。Server Component 在每次请求时执行，
 *   放在这里确保服务器 SDK 只初始化一次（性能更好）。
 *
 * Why not in layout.tsx?
 *   layout.tsx 是 React 组件，只控制客户端渲染。
 *   instrumentation.ts 是服务器生命周期，可以初始化 Node.js 级别的工具。
 */
export async function register() {
  /**
   * runtime 区分当前执行环境：
   *   'nodejs'  → 服务器端（Server Component / API Route）
   *   'edge'    → Edge Runtime（Middleware）
   *
   * runtime distinguishes execution environment:
   *   'nodejs'  → server side (Server Components / API Routes)
   *   'edge'    → Edge Runtime (Middleware)
   */
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    /**
     * 动态 import 确保服务端 Sentry 配置只在 Node.js 环境加载。
     * Dynamic import ensures server Sentry config only loads in Node.js environment.
     *
     * 不能用顶层 import，因为 Edge Runtime 也会执行这个文件，
     * 但 Edge 不支持完整 Node.js API，会报错。
     * Cannot use top-level import because Edge Runtime also runs this file
     * but doesn't support full Node.js APIs.
     */
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
