# Next Admin — Phase 2 Dashboard SSR 数据预取

> **文档定位**：技术决策 + 改造过程记录，供团队迭代参考和新人学习。  
> **改造日期**：2026-03-16  
> **改造范围**：Dashboard 页面 SSR 化（`/` 路由），引入 `@tanstack/react-query` SSR 模式。  
> **前置文档**：[Phase 0 记录](./REFACTOR_PHASE0_CN.md) · [SSR 升级分析](./SSR_UPGRADE_ANALYSIS_CN.md)

---

## 目录

1. [改造背景与目标](#一改造背景与目标)
2. [核心概念：什么是 SSR / Server Component / HydrationBoundary](#二核心概念)
3. [技术点 1：serverFetch.ts — 服务端专用 fetch 工具](#三技术点-1serverfetchts)
4. [技术点 2：DashboardStats — async Server Component](#四技术点-2dashboardstats)
5. [技术点 3：QueryClientProvider — 接入 react-query](#五技术点-3queryclientprovider)
6. [技术点 4：HydrationBoundary — 服务端数据注水](#六技术点-4hydrationboundary)
7. [技术点 5：DashboardHeader — 双路刷新按钮](#七技术点-5dashboardheader)
8. [技术点 6：INTERNAL_API_URL — Docker 内网直连](#八技术点-6internal_api_url)
9. [技术点 7：next.config.ts — webpack 类型修复](#九技术点-7nextconfigts)
10. [改造后整体数据流图](#十改造后整体数据流图)
11. [文件变更清单](#十一文件变更清单)
12. [常见坑与防范](#十二常见坑与防范)
13. [验证清单](#十三验证清单)
14. [下一阶段计划（Phase 3）](#十四下一阶段计划phase-3)

---

## 一、改造背景与目标

### 1.1 改造前的问题

改造前，Dashboard 页面是一个纯 **Client Component**（`'use client'`）。页面加载过程如下：

```
用户打开 /（Dashboard）：

1. 浏览器向 Nginx 请求 HTML
   → 收到空壳 HTML（没有实际内容）

2. 浏览器下载并执行 JS Bundle（~300 KB）
   → React 开始渲染

3. 组件挂载后，发出 3 个 API 请求：
   → GET /api/v1/admin/finance/statistics
   → GET /api/v1/admin/order/list
   → GET /api/v1/admin/client-user/list

4. 等待后端返回数据（网络往返 ~200-500ms）

5. 数据到达，React 重新渲染，用户才看到数字
```

**问题总结：**

| 问题 | 影响 |
|------|------|
| 空壳 HTML，没有内容 | 搜索引擎爬虫看不到数据（SEO 差） |
| 3 次串行 API 请求 | LCP（最大内容绘制）慢，约 1-2s |
| 页面刷新有"闪烁感" | 数字先显示 `—`，再跳变为实际值 |
| 数据请求走公网 | Admin 服务和 API 服务在同一台服务器，却绕了一圈公网 |

### 1.2 改造目标

```
目标：
  LCP < 500ms（页面打开时统计数据已经在 HTML 里）
  消除"数字闪烁"（无 loading 状态的统计卡片）
  Server Component 直连后端（内网通信，跳过公网往返）
  保留客户端交互能力（刷新按钮、订单表格）
```

### 1.3 改造前后对比

```
改造前（纯 Client Component）：

  浏览器 → Nginx → Next.js → 返回空壳 HTML
                              ↓
  浏览器执行 JS → 发出 3 个请求 → 等待数据 → 渲染

改造后（Hybrid：Server + Client）：

  浏览器 → Nginx → Next.js Server Component
                              ↓
           Next.js 直接调用后端 API（内网）
                              ↓
           返回带完整数据的 HTML（流式传输）
                              ↓
  浏览器收到 HTML，立即看到统计数字
  Client Component 用 react-query 在客户端刷新
```

---

## 二、核心概念

> 如果你已经熟悉 Next.js 13+ 的 RSC，可以跳过这节。

### 2.1 什么是 Server Component（服务端组件）

Next.js 13+ 引入了两种组件类型：

| 类型 | 标识 | 运行在 | 能做什么 | 不能做什么 |
|------|------|--------|---------|-----------|
| **Server Component** | 默认（无特殊标识） | Node.js 服务器 | 直接 fetch 数据、读 Cookie、访问数据库 | 用 useState、useEffect、事件监听 |
| **Client Component** | 文件顶部写 `'use client'` | 浏览器 | 用 React Hooks、事件交互、访问 DOM | 直接访问数据库、读 HTTP-only Cookie |

**简单理解：**
- Server Component = 在服务器上渲染，把结果 HTML 发给浏览器
- Client Component = 发给浏览器后在浏览器里运行

### 2.2 什么是 Streaming SSR（流式服务端渲染）

传统 SSR：服务器必须等所有数据都准备好，才把完整 HTML 发给浏览器。  
Streaming SSR：服务器先发送"骨架"，数据准备好一部分就立即发一部分。

用 `<Suspense>` 实现：

```tsx
// page.tsx（Server Component）
<Suspense fallback={<骨架屏 />}>
  <DashboardStats />   {/* 等待这个 Server Component 的异步数据 */}
</Suspense>
```

用户体验：页面打开瞬间看到骨架屏，约 100-200ms 后统计数字"流"进来，而不是一直白屏等待。

### 2.3 什么是 HydrationBoundary（注水边界）

"注水（Hydration）"是指：服务端渲染的 HTML 到了浏览器后，React 给它"注入"交互能力的过程。

`HydrationBoundary` 是 `@tanstack/react-query` 提供的工具，用来把服务端预取的数据"注水"给客户端的 `useQuery`：

```
服务端：
  queryClient.prefetchQuery(...)    ← 预取数据
  dehydrate(queryClient)            ← 序列化数据（转成可传输的 JSON）

HTML 传输：
  <HydrationBoundary state={序列化数据}>  ← 数据嵌入 HTML

客户端：
  useQuery(...)                     ← 自动从 HydrationBoundary 读取预取数据
                                       无需额外 API 请求，立即展示
```

---

## 三、技术点 1：serverFetch.ts

### 3.1 为什么需要单独的 serverFetch

项目中已有 `src/api/http.ts`（基于 axios），但它**不能在 Server Component 中使用**：

```typescript
// src/api/http.ts — 有浏览器专属 API
private getToken(): string | null {
  return localStorage.getItem('auth_token');  // ❌ 服务器上没有 localStorage
}

private getLanguage(): string {
  return localStorage.getItem('lang') || 'en';  // ❌ 同上
}
```

Server Component 运行在 Node.js 服务器上，没有 `localStorage`、`window`、`document`。  
所以必须用 Node.js 原生的 `fetch` API，并从 **HTTP-only Cookie** 读取 token。

### 3.2 如何读取 HTTP-only Cookie

Phase 1 已把登录 token 存到了 HTTP-only Cookie（`auth_token`）。  
在 Server Component 中，用 Next.js 提供的 `cookies()` 函数读取：

```typescript
import { cookies } from 'next/headers';

async function buildHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
```

`cookies()` 只能在 Server Component 或 Route Handler 中调用，Client Component 无法使用。

### 3.3 最终实现

```typescript
// src/lib/serverFetch.ts

export async function serverGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
  options?: { revalidate?: number | false },
): Promise<T> {
  const base = getBase();           // INTERNAL_API_URL 或 NEXT_PUBLIC_API_BASE_URL
  const url = new URL(`${base}${path}`);

  // 把 params 拼接成 query string
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    headers: await buildHeaders(),
    next: { revalidate: options?.revalidate ?? 30 },  // 30s ISR 缓存
  } as RequestInit & { next?: { revalidate?: number } });

  if (!res.ok) throw new Error(`[serverFetch] ${path} → HTTP ${res.status}`);

  const json: ApiResponse<T> = await res.json();
  if (json.code !== 10000 && json.code !== 200) {
    throw new Error(`[serverFetch] ${path} → ${json.message}`);
  }

  return json.data;
}
```

**关键设计：`next: { revalidate: 30 }`**

这是 Next.js 扩展 fetch 的特性，意思是：  
这个请求的结果会被缓存 30 秒。30 秒内同一个请求不再调用后端，直接用缓存。  
这样既能保证数据接近实时，又不会对后端造成压力。

---

## 四、技术点 2：DashboardStats（async Server Component）

### 4.1 为什么 DashboardStats 做成 Server Component

统计数字（总存款、总提现、待审核提现、用户总数）满足 Server Component 的条件：
- **只读数据**：不需要用户交互
- **首屏重要**：LCP 关键内容，越快显示越好
- **无浏览器 API 依赖**：纯数字展示

### 4.2 实现方式

```tsx
// src/components/dashboard/DashboardStats.tsx
// 注意：没有 'use client'，默认就是 Server Component

export async function DashboardStats() {
  // 并行发出两个请求（Promise.all，不是先后顺序）
  const [finance, usersRes] = await Promise.all([
    serverGet<FinanceStatistics>('/v1/admin/finance/statistics')
      .catch(() => null),  // 出错时不崩溃，显示 '—'
    serverGet<PaginatedResponse<ClientUserListItem>>(
      '/v1/admin/client-user/list',
      { page: 1, pageSize: 1 }
    ).catch(() => null),
  ]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <StatCard
        title="Total Deposits"
        value={finance ? `₱${parseFloat(finance.totalDeposit).toLocaleString()}` : '—'}
        // ...
      />
      {/* 其他 3 个卡片 */}
    </div>
  );
}
```

**关键设计：`.catch(() => null)`**

如果 API 调用失败（后端重启、网络抖动），返回 `null` 而不是抛出异常。  
组件会显示 `—` 占位符，而不是整个页面崩溃。这是生产级代码的防御性写法。

**关键设计：`Promise.all()`**

两个请求**并行**发出，总等待时间 = `max(请求1耗时, 请求2耗时)`，而不是两者相加。

### 4.3 骨架屏：DashboardStatsSkeleton

```tsx
// src/components/dashboard/DashboardStatsSkeleton.tsx
// 作为 <Suspense fallback={...}> 的占位内容

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="flex flex-col gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-white/10 animate-pulse" />
          <div className="h-8 w-28 rounded-lg bg-gray-100 dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-20 rounded-lg bg-gray-100 dark:bg-white/10 animate-pulse" />
        </Card>
      ))}
    </div>
  );
}
```

`animate-pulse` 是 Tailwind CSS 的脉冲动画，让骨架屏有"呼吸感"，比白屏体验好很多。

---

## 五、技术点 3：QueryClientProvider（接入 react-query）

### 5.1 为什么用 @tanstack/react-query

项目之前用 `ahooks/useRequest` 做客户端数据请求。  
Phase 2 引入 `@tanstack/react-query` 的原因是它**天然支持 SSR 数据注水（HydrationBoundary）**，而 `useRequest` 不支持这个场景。

两者的区别：

| 特性 | ahooks/useRequest | @tanstack/react-query |
|------|------------------|----------------------|
| 基础数据请求 | ✅ | ✅ |
| SSR 数据预取 + 注水 | ❌ | ✅ HydrationBoundary |
| 跨组件数据共享 | 🔶 需手动 | ✅ 自动（同 queryKey） |
| 刷新 / 失效 | 🔶 手动 | ✅ invalidateQueries |

### 5.2 正确的单例模式

`QueryClient` 是数据缓存的核心对象。必须注意：

- **服务端**：每次请求要新建，不能复用（否则不同用户的数据会混）
- **浏览器**：整个会话只建一个，否则缓存会丢失

```typescript
// src/components/Providers.tsx

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();   // 服务端：每次新建
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;    // 浏览器：复用单例
}

export const Providers = ({ children }) => {
  // useState 保证组件重新渲染时不重建 QueryClient
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

### 5.3 为什么用 useState 而不是 useRef

```typescript
// ❌ 错误写法
const queryClient = useMemo(() => makeQueryClient(), []);

// ✅ 正确写法
const [queryClient] = useState(() => makeQueryClient());
```

`useMemo` 在 React 严格模式下可能被调用两次，导致创建两个实例。  
`useState` 的初始化函数只调用一次，保证单例。

---

## 六、技术点 4：HydrationBoundary（服务端数据注水）

### 6.1 问题：Server Component 拿到数据，Client Component 还要再请求一次吗？

如果不做任何处理：

```
服务端：DashboardStats 请求了统计数据 ✅
浏览器：DashboardOrdersClient 挂载，useQuery 再请求一次订单数据 ❌（多余！）
```

`HydrationBoundary` 解决这个问题：把服务端已取到的数据"序列化"塞进 HTML，  
客户端 `useQuery` 醒来后，发现缓存里已经有数据，直接用，不再发请求。

### 6.2 完整的注水流程

**第一步：服务端预取数据（page.tsx）**

```tsx
// src/app/(dashboard)/page.tsx — Server Component

export default async function DashboardPage() {
  const queryClient = new QueryClient();

  // 预取订单列表
  await queryClient.prefetchQuery({
    queryKey: ['dashboard-orders'],   // 缓存 key，客户端用同一个 key 匹配
    queryFn: () =>
      serverGet<PaginatedResponse<Order>>('/v1/admin/order/list', {
        page: 1, pageSize: 5
      }),
  });

  return (
    <div>
      {/* 序列化预取数据，注入 HTML */}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DashboardOrdersClient />
      </HydrationBoundary>
    </div>
  );
}
```

**第二步：客户端自动读取（DashboardOrdersClient.tsx）**

```tsx
// src/components/dashboard/DashboardOrdersClient.tsx
'use client';

export function DashboardOrdersClient() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-orders'],  // ← 与服务端 prefetchQuery 的 key 完全一致
    queryFn: () => orderApi.getList({ page: 1, pageSize: 5 }),
    staleTime: 30_000,
  });
  // 第一次渲染时：isLoading = false，data = 服务端预取的数据（无需等待）
  // 30 秒后数据变 stale，用户交互触发后才重新请求
}
```

**关键：`queryKey` 必须完全一致。**  
服务端用 `['dashboard-orders']` 预取，客户端 `useQuery` 也用 `['dashboard-orders']`，  
react-query 才能把两者关联起来。

### 6.3 dehydrate / HydrationBoundary 内部原理（简化版）

```
服务端：
  queryClient 缓存:
    'dashboard-orders' → { list: [...5条订单], total: 120 }

  dehydrate(queryClient) →
    {
      "queries": [{
        "queryKey": ["dashboard-orders"],
        "state": { "data": { "list": [...], "total": 120 } }
      }]
    }

HTML 中嵌入：
  <script>window.__RQ_DEHYDRATED_STATE__ = {...}</script>

浏览器 HydrationBoundary 读取并填充 QueryClient 缓存：
  queryClient['dashboard-orders'] = { list: [...], total: 120 }

useQuery 调用：
  缓存命中，isLoading = false，立即返回数据 ✅
```

---

## 七、技术点 5：DashboardHeader（双路刷新按钮）

### 7.1 问题：Server Component 如何"刷新"？

Server Component 是在服务器上渲染的，用户点击按钮时，  
需要让服务器**重新运行** `DashboardStats`，把新数据的 HTML 推给浏览器。

Next.js 提供了 `router.refresh()` 来做这件事：

```
router.refresh() 的作用：
  → 告诉 Next.js：重新向服务器请求当前路由
  → 服务器重新执行所有 Server Component
  → 返回新的 HTML 片段（不刷新整页，无白屏）
  → 客户端 React 用新 HTML 更新对应 DOM 节点
```

### 7.2 Client Component 也需要独立刷新

订单列表是 Client Component，用 `useQuery` 管理数据。  
`router.refresh()` 不会触发 `useQuery` 重新请求，需要单独调用：

```typescript
await queryClient.invalidateQueries({ queryKey: ['dashboard-orders'] });
```

`invalidateQueries` 把对应 key 的缓存标记为"过期"，  
下次组件渲染（或者 focus 窗口）时，自动触发重新请求。

### 7.3 最终实现

```tsx
// src/components/dashboard/DashboardHeader.tsx
'use client';

export function DashboardHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);

    router.refresh();   // ① 刷新 Server Components（DashboardStats 重新 fetch）

    await queryClient.invalidateQueries({
      queryKey: ['dashboard-orders']   // ② 刷新 Client Components（订单列表重新 fetch）
    });

    setRefreshing(false);
  };

  return (
    <button onClick={handleRefresh}>
      <RefreshCw className={refreshing ? 'animate-spin' : ''} />
      Refresh
    </button>
  );
}
```

**两路刷新同时触发，互不等待**，用户点一下按钮，所有数据都更新。

---

## 八、技术点 6：INTERNAL_API_URL（Docker 内网直连）

### 8.1 问题：Server Component 发出的请求去哪里了？

```
改造前（Client Component 发请求）：
  浏览器 → 公网 → api.joyminis.com → Nginx → 后端容器

改造后（Server Component 发请求）：
  Next.js 容器 → 公网？ → api.joyminis.com → Nginx → 后端容器
```

**问题**：Admin 前端和后端都在同一台 VPS 的 Docker 里，  
Server Component 的请求如果走公网（`https://api.joyminis.com`），  
要出去绕一圈再回来，多了几十到几百毫秒的延迟，还多占带宽。

### 8.2 解决方案：Docker 内网直连

Docker Compose 里的容器可以直接用**容器名**互相访问：

```
Docker 网络内部：
  lucky-admin-next-dev 容器
        ↓ (HTTP，不用走公网)
  lucky-backend-dev:3000 容器
```

### 8.3 实现方式

**环境变量优先级**（`src/lib/serverFetch.ts`）：

```typescript
function getBase(): string {
  return (
    process.env.INTERNAL_API_URL ||           // 优先用内网 URL
    process.env.NEXT_PUBLIC_API_BASE_URL ||   // 回退到公网 URL
    'http://localhost:3000'                   // 最后回退到本地
  );
}
```

**各环境的配置**：

| 环境 | 配置文件 | INTERNAL_API_URL 值 |
|------|---------|-------------------|
| 本地开发（无 Docker） | `.env.development` | `http://localhost:3000` |
| Docker 开发 | `compose.yml` | `http://lucky-backend-dev:3000` |
| Docker 生产 | `compose.prod.yml` | `http://lucky-backend-prod:3000` |

**compose.yml 配置片段：**

```yaml
admin-next:
  environment:
    NEXT_PUBLIC_API_BASE_URL: /api          # 浏览器请求用（走 nginx 代理）
    INTERNAL_API_URL: http://lucky-backend-dev:3000  # Server Component 用（内网直连）
```

**为什么 `INTERNAL_API_URL` 不加 `NEXT_PUBLIC_` 前缀？**

带 `NEXT_PUBLIC_` 的环境变量会在构建时被**打包进客户端 JS**，任何人都能看到。  
`INTERNAL_API_URL` 是内网地址，只有服务器需要知道，不应该暴露给浏览器。  
不加 `NEXT_PUBLIC_` 前缀，Next.js 只会在服务端使用它，客户端读取结果为 `undefined`。

---

## 九、技术点 7：next.config.ts（webpack 类型修复）

### 9.1 问题

`next.config.ts` 里有这样的代码：

```typescript
import webpack from 'webpack';  // ❌ TS2307: Cannot find module 'webpack'

webpack: (config, { isServer }) => {
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(...)  // 使用了 webpack 变量
  );
}
```

**报错原因**：`webpack` 的 TypeScript 类型声明（`@types/webpack`）没有安装。  
Next.js 把 webpack 内置了，但不需要（也不建议）单独安装它的类型。

### 9.2 解决方案：从回调参数解构

Next.js 的 `webpack` 配置函数会把 webpack 实例作为参数传进来：

```typescript
// next.config.ts
webpack: (config, { isServer, webpack }) => {
  //                            ↑ 从这里解构，不需要单独 import
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(...)
  );
}
```

删掉 `import webpack from 'webpack'`，从回调参数的第二个对象里解构 `webpack`，  
类型自动推断，无报错。

---

## 十、改造后整体数据流图

```
用户打开 / (Dashboard)
         │
         ▼
   ┌─────────────────────────────────────────────────────┐
   │  Next.js Server Component (page.tsx)                │
   │                                                      │
   │  1. new QueryClient()                               │
   │  2. prefetchQuery('dashboard-orders')               │
   │     → serverGet('/v1/admin/order/list')             │
   │     → HTTP 请求 → lucky-backend-dev:3000 (内网)     │
   │                                                      │
   │  并行（Suspense streaming）：                        │
   │  3. DashboardStats                                   │
   │     → serverGet('/v1/admin/finance/statistics')     │
   │     → serverGet('/v1/admin/client-user/list')       │
   │     → 两者 Promise.all() 并行                       │
   └─────────────────────────────────────────────────────┘
         │
         │  所有数据获取完毕（内网，约 5-20ms）
         ▼
   ┌─────────────────────────────────────────────────────┐
   │  Next.js 生成 HTML（含完整数据）                     │
   │                                                      │
   │  - 4 个统计卡片已有数字（no loading）                │
   │  - HydrationBoundary 里嵌入订单数据 JSON            │
   └─────────────────────────────────────────────────────┘
         │
         │  Streaming 传输到浏览器
         ▼
   ┌─────────────────────────────────────────────────────┐
   │  浏览器渲染                                          │
   │                                                      │
   │  - 立即看到统计数字（已在 HTML 里）                  │
   │  - React Hydration: DashboardOrdersClient 激活       │
   │    → useQuery 从 HydrationBoundary 读取预取数据      │
   │    → 无额外请求，立即展示订单表格                    │
   │                                                      │
   │  - DashboardHeader 客户端激活（刷新按钮可点击）      │
   └─────────────────────────────────────────────────────┘
         │
         │  用户点击 Refresh
         ▼
   ┌─────────────────────────────────────────────────────┐
   │  双路刷新（DashboardHeader）                         │
   │                                                      │
   │  router.refresh()                                    │
   │    → 服务器重跑 DashboardStats，推送新 HTML          │
   │                                                      │
   │  queryClient.invalidateQueries('dashboard-orders')  │
   │    → useQuery 标记缓存过期，重新 fetch 订单          │
   └─────────────────────────────────────────────────────┘
```

---

## 十一、文件变更清单

### 新增文件

| 文件路径 | 类型 | 用途 |
|---------|------|------|
| `src/lib/serverFetch.ts` | 工具函数 | 服务端专用 fetch，读 Cookie，走内网 |
| `src/components/dashboard/DashboardStats.tsx` | Server Component | 服务端拉取并渲染统计卡片 |
| `src/components/dashboard/DashboardStatsSkeleton.tsx` | 纯 UI | Suspense 骨架屏占位 |
| `src/components/dashboard/DashboardOrdersClient.tsx` | Client Component | 客户端订单表格，useQuery |
| `src/components/dashboard/DashboardHeader.tsx` | Client Component | 标题 + 双路刷新按钮 |

### 修改文件

| 文件路径 | 改动内容 |
|---------|---------|
| `src/app/(dashboard)/page.tsx` | 从 `'use client'` 改为 Server Component，加 Suspense + HydrationBoundary |
| `src/components/Providers.tsx` | 加入 `QueryClientProvider`，单例模式创建 QueryClient |
| `next.config.ts` | 修复 TS2307：删除 `import webpack`，改为从回调参数解构 |
| `compose.yml` | 新增 `INTERNAL_API_URL=http://lucky-backend-dev:3000` |
| `compose.prod.yml` | 新增 `INTERNAL_API_URL=http://lucky-backend-prod:3000` |
| `apps/admin-next/.env.development` | 新增 `INTERNAL_API_URL=http://localhost:3000` |

---

## 十二、常见坑与防范

### 坑 1：在 Server Component 里用 axios / localStorage

**现象**：`ReferenceError: localStorage is not defined`  
**原因**：Server Component 运行在 Node.js，没有浏览器 API  
**解决**：Server Component 里只能用 `serverGet`，不能用 `http`（axios 客户端）

```typescript
// ❌ Server Component 里不能这样写
import { financeApi } from '@/api';
const data = await financeApi.getStatistics();  // 内部用 axios + localStorage

// ✅ 正确写法
import { serverGet } from '@/lib/serverFetch';
const data = await serverGet<FinanceStatistics>('/v1/admin/finance/statistics');
```

### 坑 2：queryKey 不一致

**现象**：客户端组件还是会发 API 请求，HydrationBoundary 没有效果  
**原因**：服务端 `prefetchQuery` 和客户端 `useQuery` 的 `queryKey` 不一样  
**解决**：保持完全一致，包括数组元素的顺序和类型

```typescript
// ✅ 服务端
await queryClient.prefetchQuery({ queryKey: ['dashboard-orders'], ... });

// ✅ 客户端（完全一致）
const { data } = useQuery({ queryKey: ['dashboard-orders'], ... });

// ❌ 不一致（会导致注水失败）
const { data } = useQuery({ queryKey: ['orders', 'dashboard'], ... });
```

### 坑 3：QueryClient 每次渲染都新建

**现象**：页面数据频繁重新请求，缓存不生效  
**原因**：在组件体内直接 `new QueryClient()` 会在每次渲染时新建  
**解决**：用 `useState` 初始化函数，保证只创建一次

```typescript
// ❌ 错误
const queryClient = new QueryClient();

// ✅ 正确
const [queryClient] = useState(() => new QueryClient());
```

### 坑 4：INTERNAL_API_URL 用了相对路径

**现象**：Server Component 请求报错 `TypeError: Failed to parse URL`  
**原因**：`serverGet` 里用 `new URL(base + path)`，`base` 必须是绝对 URL  
**解决**：`INTERNAL_API_URL` 和 `NEXT_PUBLIC_API_BASE_URL` 在服务端必须是绝对地址

```bash
# ❌ 相对路径，Server Component 无法使用
INTERNAL_API_URL=/api

# ✅ 绝对地址
INTERNAL_API_URL=http://lucky-backend-dev:3000
```

### 坑 5：Suspense 包裹的组件不是 async function

**现象**：`<Suspense>` 骨架屏一闪而过，没有真正等待数据  
**原因**：只有 `async` 的 Server Component（或使用了 Suspense 兼容 API）才会触发 Suspense 等待  
**解决**：确保被 Suspense 包裹的 Server Component 是 `async function`

```tsx
// ✅ 能触发 Suspense
export async function DashboardStats() {
  const data = await serverGet(...);
  return <div>{data}</div>;
}

// ❌ 不会触发 Suspense（同步组件）
export function DashboardStats() {
  return <div>...</div>;
}
```

---

## 十三、验证清单

改造完成后，按以下步骤验证：

```bash
# 1. TypeScript 类型检查（本地）
cd lucky_nest_monorepo
npx tsc --project apps/admin-next/tsconfig.json --noEmit
# 期望：无 error TS 输出

# 2. 生产构建验证
yarn workspace @lucky/admin-next build
# 期望：
#   ┌ ƒ /   ← Dashboard 显示 ƒ（Dynamic，服务端渲染）
#   ○ /login ← 登录页显示 ○（Static，静态预渲染）
#   无报错

# 3. 启动本地开发服务器
yarn workspace @lucky/admin-next dev
# 访问 http://localhost:4001/
# 期望：打开 Dashboard 时，统计数字无 loading 状态直接显示

# 4. 检查 Network Tab
# F12 → Network → 刷新 Dashboard
# 期望：
#   - 第一个 HTML 响应里已经包含统计数字（不是空壳）
#   - 没有 /v1/admin/finance/statistics 的额外请求（HydrationBoundary 注水成功）
```

---

## 十四、下一阶段计划（Phase 3）

Phase 2 只改造了 Dashboard 首页。Phase 3 目标是改造**列表页**（`/users`、`/orders`、`/products` 等），  
让 URL 的 `searchParams` 驱动服务端 filter，支持分享带条件的链接。

### Phase 3 核心改动

```
目前（纯 Client Component）：
  filter 状态存在 useState 里
  → 用户分享链接，对方打开看到的是没有 filter 的列表
  → 刷新页面，filter 重置

改造后（Hybrid Server Component）：
  filter 状态存在 URL searchParams 里
  → 用户分享链接，对方打开看到相同 filter 的结果
  → 刷新页面，filter 保留
  → Server Component 读 searchParams 做服务端 filter，首屏即有数据
```

### 改造模式

每个列表页遵循统一模式：

```
app/(dashboard)/users/page.tsx        ← Server Component，接收 searchParams
src/components/users/UsersClient.tsx  ← Client Component（原 views/UserManagement.tsx 拆出来）
```

```tsx
// app/(dashboard)/users/page.tsx
export default async function UsersPage({
  searchParams,
}: {
  searchParams: { page?: string; keyword?: string; status?: string };
}) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['users', searchParams],
    queryFn: () => serverGet('/v1/admin/client-user/list', {
      page: searchParams.page ?? 1,
      keyword: searchParams.keyword,
      status: searchParams.status,
    }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersClient initialParams={searchParams} />
    </HydrationBoundary>
  );
}
```

**受影响页面**：`/users` `/products` `/orders` `/banners` `/kyc` `/finance` `/groups`

