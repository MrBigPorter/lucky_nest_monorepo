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
  // Cloudflare Free Worker has strict script size limits.
  // Keep only browser-side Sentry (`src/instrumentation-client.ts`) for now.
}
