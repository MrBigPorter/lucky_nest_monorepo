# Finance Transactions 缓存契约（Phase 6 P0 / tab 1）

> 日期：2026-03-23  
> 范围：`transactions` tab（`TransactionList.tsx`）

---

## 1. 问题

### Q1：为什么 `transactions` 这轮不直接改成 Server 预取 + Hydration？

**答案：因为当前 `transactions` 仍依赖 `SmartTable` 的客户端请求模型，直接改成 Orders 那种 Hydration 会波及更大。**

与 `Orders` 不同：

- `Orders` 只有一个列表，URL 参数与分页关系更直接
- `Finance` 有 3 个 tab，共享同一页面 URL，且列表参数整形逻辑分散在各自 view 中
- `TransactionList` 当前仍通过 `SmartTable -> request -> financeApi.getTransactions()` 拉取数据，读侧并没有接入 Next.js Data Cache

因此本轮目标不是强行上 Hydration，而是先把：

1. 参数契约补齐
2. 写侧失效映射说明清楚
3. 读侧缓存路线留出后续演进空间

---

## 2. 当前读写契约

### 读接口

- API：`/v1/admin/finance/transactions`
- 文件：`apps/admin-next/src/views/finance/TransactionList.tsx`
- 模式：客户端 `SmartTable` 请求
- 一致性等级：秒级

### 写操作对它的影响

| 写操作             | 为什么影响 transactions | 当前失效 tag           |
| ------------------ | ----------------------- | ---------------------- |
| `adjust`           | 调账会生成或影响流水    | `finance:transactions` |
| `withdrawalsAudit` | 提现审核会影响流水      | `finance:transactions` |
| `syncRecharge`     | 充值同步成功会影响流水  | `finance:transactions` |

说明：写侧失效映射已经在 `apps/admin-next/src/lib/actions/finance-revalidate.ts` 中落地。

---

## 3. 本轮实际修复

### Q2：既然这轮不做 Hydration，那做了什么？

**答案：补了 `transactions` tab 的 URL 参数透传闭环。**

修复文件：

- `apps/admin-next/src/components/finance/FinancePageClient.tsx`

修复前：

- `transactions` tab 没有像 `deposits` / `withdrawals` 一样接收 `initialFormParams`
- 也没有通过 `onParamsChange` 把筛选条件回写 URL
- 结果是 `transactions` 的参数契约比另外两个 tab 更弱

修复后：

- `transactions` 现在也接收 `initialFormParams`
- 并在参数变化时回写 URL，附带 `tab: 'transactions'`
- 这样三个 tab 的参数流向保持一致

---

## 4. 为什么现在还不能说 `finance:transactions` 已真正接入 Next Cache？

### Q3：既然已经定义了 `finance:transactions`，是不是读侧已经缓存化了？

**答案：还没有，当前只有“写侧失效契约”，没有“读侧 Next Data Cache 消费”。**

原因：

- `finance:transactions` 目前由写操作负责失效
- 但 `TransactionList` 仍走客户端 HTTP 请求，不会消费 `revalidateTag` 对应的 Next.js Data Cache

所以当前状态应准确表述为：

- ✅ `finance:transactions` 已成为**统一失效语言**
- ❌ `transactions` 读侧尚未接入 Next.js Server Cache

这不是 bug，而是本轮刻意选择的**低风险阶段性方案**。

---

## 5. 后续升级路线

如果下一轮要继续升级 `transactions`，建议顺序：

1. 抽出 transactions 专属 query key / 参数归一化 helper
2. 在 `finance/page.tsx` 针对 `transactions` tab 做局部 Server 预取
3. 再决定是否要把 `SmartTable` 包一层 Hydration 适配，而不是全局重写

---

## 6. 回归验证

- `check-types`：通过
- `lint`：通过
- `vitest`：31 files / 183 tests 通过

---

## 7. 心智模型提问

**如果一个 tag 只存在于写侧失效逻辑，而读侧还没有真正消费它，这个 tag 的价值是什么？**

> 答：它先统一了业务语言与失效面，为下一轮读侧缓存化预铺契约；不是立刻产生缓存命中收益，但能避免以后失效语义再次分叉。

---

## 8. 2026-03-23 增量：deposits / withdrawals 按需 Client Prefetch

- `transactions` 保持 Server 预取 + HydrationBoundary 注水（`finance/page.tsx`）
- `deposits` / `withdrawals` 本轮不做 Server 预取，改为 tab hover 触发 `queryClient.prefetchQuery`
- 两个 tab 已补齐各自 query contract：
  - `apps/admin-next/src/lib/cache/finance-deposits-cache.ts`
  - `apps/admin-next/src/lib/cache/finance-withdrawals-cache.ts`
- 对应列表已接入 `SmartTable` 的 `enableHydration + hydrationQueryKey`，命中预热缓存时可直接消费

### 心智模型提问（本次）

**为什么不直接给三个 tab 都做 Server 预取？**

> 答：Finance 是 tab 结构，三 tab 全量 Server 预取会放大首屏请求和 hydration payload；按需 Client Prefetch 能在“切 tab 体感”与“首屏成本”之间取得更稳的平衡。
