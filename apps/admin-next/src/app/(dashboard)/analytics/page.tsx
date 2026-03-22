/**
 * ============================================================
 * Analytics Page — 数据分析页
 * ============================================================
 *
 * 【这个文件是什么？】
 *   Next.js App Router 的"路由入口文件"。
 *   文件本身是 Server Component（服务端组件），
 *   意味着它在服务器上执行，HTML 直接返回给浏览器，
 *   浏览器不需要等待 JS 下载完再渲染内容。
 *
 * 【页面由两层组成】
 *   ┌─────────────────────────────────────────────┐
 *   │  Server Component (这个文件)                 │
 *   │  ├─ AnalyticsOverview  ← 也是 Server Component │
 *   │  │    在服务器直接查数据库，首屏就有数字       │
 *   │  └─ AnalyticsTrendSection ← Client Component  │
 *   │       recharts 图表，浏览器加载后才渲染        │
 *   └─────────────────────────────────────────────┘
 *
 * 【性能优化时间线】
 *   Stage 2（2026-03-16）：AnalyticsOverview 改为 SSR，消灭加载闪烁
 *   Stage 5（2026-03-17）：加 Suspense 骨架屏，流式推送（Streaming）
 *   2026-03-22：recharts 改为 dynamic() 延迟加载，降低 TBT
 */
import type { Metadata } from 'next';

/**
 * 【metadata 是什么？】
 *   Next.js 内置的 SEO 方案。
 *   这里设置的 title 会变成浏览器标签页标题，
 *   也会被 Google 抓取为搜索结果标题。
 *   写在 Server Component 里才生效，Client Component 里写无效。
 */
export const metadata: Metadata = { title: 'Analytics' };

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { AnalyticsOverviewSkeleton } from '@/components/analytics/AnalyticsOverviewSkeleton';
import { PageHeader } from '@/components/scaffold/PageHeader';

/**
 * 【dynamic() 是什么？为什么要用它？】
 *
 *   问题背景：
 *     recharts（图表库）打包后约 90KB（gzip），
 *     如果正常 import，它会被打进首屏 JS bundle，
 *     浏览器必须先下载 + 解析这 90KB，才能渲染页面。
 *     这会让 TBT（总阻塞时间）飙高，用户感觉页面"卡"。
 *
 *   解决方案 — dynamic() 延迟加载：
 *     dynamic() 是 Next.js 对 React.lazy() 的封装。
 *     它告诉打包器："这个组件单独打成一个 chunk，
 *     不要放进首屏 bundle，等需要渲染时再异步下载。"
 *
 *   两个关键配置：
 *     ssr: false
 *       → 服务端不预渲染这个组件。
 *       → 原因：recharts 依赖浏览器 DOM API（window/document），
 *         在 Node.js 环境里运行会报错。
 *
 *     loading: () => <骨架占位 />
 *       → 组件下载期间显示的占位内容。
 *       → 避免布局跳动（CLS），让用户知道内容在加载。
 *
 *   效果：
 *     首屏 JS bundle 减少 ~90KB
 *     → FCP / LCP 更快（更少 JS 需要解析）
 *     → TBT 更低（主线程阻塞减少）
 */
const AnalyticsTrendSection = dynamic(
  () =>
    import('@/components/analytics/AnalyticsTrendSection').then(
      // .then() 的作用：这个文件导出了多个内容，
      // 这里精确取出 AnalyticsTrendSection 这一个命名导出，
      // 避免整个模块都被加载。
      (mod) => mod.AnalyticsTrendSection,
    ),
  {
    ssr: false,
    loading: () => (
      // 高度固定为 320px — 和真实图表一样高，防止 CLS（布局偏移）
      <div className="h-[320px] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
    ),
  },
);

/**
 * 【页面主体结构说明】
 *
 *   Suspense + AnalyticsOverview（流式 SSR）：
 *     服务器开始处理页面时，先把 HTML 框架发给浏览器，
 *     AnalyticsOverview 里的数据库查询在后台异步跑。
 *     查完了，服务器把这块 HTML "流式追加"到已发出的响应里。
 *     浏览器无需等全部数据就绪，就能看到页面框架。
 *     等待期间显示 AnalyticsOverviewSkeleton（灰色骨架屏）。
 *
 *   AnalyticsTrendSection（纯客户端）：
 *     服务端返回一个空占位（loading 里的 div），
 *     浏览器加载完成后异步下载 recharts chunk，
 *     下载完才渲染图表。
 */
export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* 页头：纯静态展示，无数据依赖，立即渲染 */}
      <PageHeader
        title="Data Analytics"
        description="Real-time overview of users, orders, revenue and trends."
      />

      {/*
       * 统计卡片区 — Suspense 流式 SSR
       *
       * fallback={<AnalyticsOverviewSkeleton />}
       *   → 服务器数据还没准备好时，先发这个骨架屏给浏览器
       *
       * <AnalyticsOverview />
       *   → async Server Component，内部直接 fetch/db 查询
       *   → 查完后，Next.js 把真实内容"流式"替换骨架屏
       */}
      <Suspense fallback={<AnalyticsOverviewSkeleton />}>
        <AnalyticsOverview />
      </Suspense>

      {/*
       * 趋势图表区 — dynamic() 客户端延迟加载
       *
       * 这里写 <AnalyticsTrendSection /> 就够了，
       * dynamic() 已经配好了 loading 占位和 ssr: false，
       * Next.js 会自动处理懒加载逻辑。
       */}
      <AnalyticsTrendSection />
    </div>
  );
}
