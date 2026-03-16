# Next Admin — Phase 3 列表页 Hybrid 模式重构记录

> **文档定位**：技术决策 + 改造过程记录，供团队迭代参考和新人学习。  
> **改造日期**：2026-03-16  
> **改造范围**：所有列表页（`/users`, `/orders`, `/products`, `/banners` 等）  
> **前置文档**：[Phase 2 记录](./REFACTOR_PHASE2_CN.md) · [SSR 升级分析](./SSR_UPGRADE_ANALYSIS_CN.md)

---

## 目录

1. [改造背景与目标](#一改造背景与目标)
2. [核心痛点分析](#二核心痛点分析)
3. [标准改造模式（三步走）](#三标准改造模式三步走)
4. [技术点 1：Server Component 接管入口](#四技术点-1server-component-接管入口)
5. [技术点 2：Client Component 捕获与同步 URL](#五技术点-2client-component-捕获与同步-url)
6. [技术点 3：View 层接收参数并回显](#六技术点-3view-层接收参数并回显)
7. [常见坑与防范](#七常见坑与防范)

---

## 一、改造背景与目标

### 1.1 为什么要重构列表页？

改造前，所有后台列表页的筛选条件（如关键词、状态、日期范围等）都是通过 **React 内部的状态（`useState`）** 或内部表单管理的。这带来了几个典型的"后台系统顽疾"：

1. **无法分享链接**：当运营人员筛选出"状态为待发货的手机号包含123的订单"时，复制 URL 发给同事，对方打开后看到的是**默认的全部列表**。
2. **刷新即丢失**：好不容易选好了一堆筛选条件，按了一下 `F5` 刷新，条件全没了。
3. **后退陷阱**：从列表页点进详情页，再点浏览器的"后退"返回列表时，之前的筛选条件丢失。

### 1.2 改造目标（Phase 3）

**目标：URL 驱动状态（URL as Single Source of Truth）**

将所有列表页的过滤条件同步到 URL 的 `searchParams`（查询参数）中。  
例如：`/orders` → `/orders?keyword=123&orderStatus=2`

实现的效果：
- ✅ **支持深度链接（Deep Linking）**：分享带有查询参数的链接，其他人点开能看到一模一样的筛选结果。
- ✅ **抗刷新**：刷新页面不丢失任何筛选状态。
- ✅ **友好的路由体验**：修改条件时更新 URL，但不触发页面整体的刷新和白屏。

---

## 二、核心痛点分析

在 Next.js (App Router) 中，实现 URL 驱动有几个挑战：

1. `useSearchParams` 只能在 Client Component 中使用。
2. 如果把 `page.tsx` 直接写成 Client Component 并在里面用 `useSearchParams`，Next.js 在构建时**会导致整个路由失去静态优化的可能**，并且在流式渲染（Streaming SSR）时，如果在顶层没有 `<Suspense>` 包裹 `useSearchParams`，会导致全页面降级为客户端渲染。
3. 直接用原生的 `<a href>` 或 `router.push()` 会导致产生大量的历史记录（按一次后退要退很久）。

因此，我们需要设计一种兼顾 **服务端流式渲染（SSR Streaming）** 和 **客户端无刷新更新** 的 Hybrid 模式。

---

## 三、标准改造模式（三步走）

对于每一个列表页，我们都遵循以下标准的三步重构范式：

```
1. 页面级 (Server): src/app/(dashboard)/[模块]/page.tsx
   - 职责：作为纯服务端入口，包裹 <Suspense> 提供骨架屏，渲染客户端接管层。

2. 接管层 (Client): src/components/[模块]/[模块]Client.tsx
   - 职责：读取 URL 参数（useSearchParams），实现 router.replace 逻辑，连接视图层。

3. 视图层 (Client): src/views/[模块]Management.tsx
   - 职责：接收 initialFormParams 初始化表单，并在用户搜索/重置时调用 onParamsChange 向上抛出。
```

---

## 四、技术点 1：Server Component 接管入口

**改造前：**
`page.tsx` 直接标注了 `'use client'`，并直接返回 `XXXManagement` 组件。

**改造后：**
移除 `'use client'`，改为纯服务端组件，并严格使用 `<Suspense>` 包裹用到 `useSearchParams` 的子组件。

```tsx
// 示例：src/app/(dashboard)/orders/page.tsx

import React, { Suspense } from 'react';
import { OrdersClient } from '@/components/orders/OrdersClient';

// 1. 定义骨架屏
function OrdersPageSkeleton() {
  return (
    <div className="rounded-xl border ... animate-pulse">
      {/* ...骨架屏 UI... */}
    </div>
  );
}

// 2. 导出默认的 Server Component
export default function OrdersPage() {
  return (
    // ⚠️ 极其重要：必须用 Suspense 包裹内部使用 useSearchParams 的组件
    <Suspense fallback={<OrdersPageSkeleton />}>
      <OrdersClient />
    </Suspense>
  );
}
```

**为什么必须加 `<Suspense>`？**
在 Next.js 的 App Router 中，`useSearchParams()` 是一个会触发客户端**异步边界**的 Hook。如果你不在外面包一层 `<Suspense>`，Next.js 遇到它时会把整个页面的流式 SSR 强制降级（de-opt）到纯客户端渲染。

---

## 五、技术点 2：Client Component 捕获与同步 URL

创建一个新的中间组件层 `XxxClient.tsx`。

```tsx
// 示例：src/components/orders/OrdersClient.tsx
'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OrderManagement } from '@/views/OrderManagement';

export function OrdersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. 将 URL 中的 searchParams 提取为表单可用的对象（只读一次作为 initial）
  const urlFilterParams = useMemo(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      // 过滤掉不属于表单的内容（如分页）或空值
      if (key !== 'page' && key !== 'pageSize' && value) {
        params[key] = value;
      }
    });
    return params;
  }, [searchParams]);

  // 2. 当用户在页面里修改了筛选条件时，将新条件写回 URL
  const handleParamsChange = useCallback(
    (formData: Record<string, unknown>) => {
      const qs = new URLSearchParams();
      Object.entries(formData).forEach(([key, value]) => {
        // 过滤掉无效值，"ALL" 这种默认值通常也不需要体现在 URL 中
        if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
          qs.set(key, String(value));
        }
      });
      const newUrl = qs.toString() ? `/orders?${qs.toString()}` : '/orders';
      
      // ⚠️ 极其重要：使用 replace 而不是 push，且设置 scroll: false
      router.replace(newUrl, { scroll: false });
    },
    [router],
  );

  return (
    <OrderManagement
      initialFormParams={urlFilterParams}
      onParamsChange={handleParamsChange}
    />
  );
}
```

**为什么用 `router.replace` 而不是 `router.push`？**
如果使用 `push`，用户每改变一次筛选条件（比如输一个字、切一个下拉框），浏览器历史记录就会多一条。当用户想点浏览器的"后退"键返回上一个页面时，他必须狂点无数次才能退出这个列表页。`replace` 会替换当前的 URL 记录，解决这个问题。

**为什么用 `scroll: false`？**
Next.js 默认在路由更新时会将页面滚动到顶部。在过滤表格时，我们不希望页面乱跳，所以禁用滚动。

---

## 六、技术点 3：View 层接收参数并回显

改造原本的 `src/views/XxxManagement.tsx`，让它的表格和表单能够接纳外部传入的状态。

```tsx
// 示例：src/views/OrderManagement.tsx
'use client';

// ... 导入省略 ...

interface OrderManagementProps {
  initialFormParams?: Record<string, unknown>;
  onParamsChange?: (params: Record<string, unknown>) => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  initialFormParams,
  onParamsChange,
}) => {
  
  // 1. 在表格请求库（useAntdTable 或 useRequest）初始化时，塞入从 URL 拿到的初始值
  const { tableProps, run, search: { reset } } = useAntdTable(getTableData, {
    defaultPageSize: 10,
    defaultParams: [
      { current: 1, pageSize: 10 },
      {
        keyword: (initialFormParams?.keyword as string) || '',
        orderStatus: (initialFormParams?.orderStatus as string) || 'All',
      },
    ],
  });

  return (
    // ...
      <SchemaSearchForm
        schema={[ /* ... */ ]}
        
        // 2. 表单组件本身也要能够显示初始值（回显）
        initialValues={{
          keyword: (initialFormParams?.keyword as string) || '',
          orderStatus: (initialFormParams?.orderStatus as string) || 'All',
        }}
        
        // 3. 在用户点击搜索时，不仅通知表格去拉数据，还要通知上层更新 URL
        onSearch={(v) => {
          run({ current: 1, pageSize: 10 }, v);
          onParamsChange?.(v);
        }}
        
        // 4. 重置时，要把 URL 也清理掉
        onReset={() => {
          reset();
          onParamsChange?.({ keyword: '', orderStatus: 'All' });
        }}
      />
    // ...
  );
};
```

---

## 七、常见坑与防范

### 坑 1：无限刷新/重渲染循环

**现象**：页面疯狂闪烁，控制台请求不断。
**原因**：在组件渲染周期内，错误地将 `searchParams` 作为 `useEffect` 或 `useMemo` 的强依赖，而内部的请求逻辑又反过来更新了状态，导致闭环。
**防范**：在 `XxxClient.tsx` 中，`urlFilterParams` 仅作为 `initialFormParams` 传给 `View` 组件，表格组件只在**初始化（mount）时**消费一次这个参数。此后由内部的 Form 去驱动请求，而不是时刻监听 URL 的变化去拉数据。

### 坑 2：Type Error 导致构建失败

**现象**：`ESLint: Unexpected any. Specify a different type.`
**原因**：为了图方便给 `initialFormParams` 定义为 `Record<string, any>`。
**防范**：严格使用 `Record<string, unknown>`，并在使用时通过 `as string` 或 `Number()` 进行安全的类型断言和转换。

### 坑 3：默认参数污染 URL

**现象**：URL 里挂着 `?status=ALL&keyword=` 这样又丑又没意义的参数。
**原因**：表单在初始化或重置时，发出了包含空字符串或默认值的对象。
**防范**：在 `handleParamsChange` 里做严格清洗。`value !== undefined && value !== null && value !== '' && value !== 'ALL'` 的时候，才调用 `qs.set()`。
