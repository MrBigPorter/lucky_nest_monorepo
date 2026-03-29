# Admin Next SSR + 体验 + 性能优化计划（执行版）

> 适用范围：`apps/admin-next`  
> 目标：在保持后台强交互能力的前提下，系统化提升首屏速度、交互流畅度、可观测性  
> 关联文档：
>
> - 架构现状评审：`../architecture/ADMIN_NEXT_SSR_CSR_REVIEW_CN.md`
> - Lighthouse 验收与历史记录：`./PERFORMANCE_LIGHTHOUSE_CN.md`
> - 生产 Lighthouse 运行手册：`../../../apps/admin-next/scripts/lighthouse/PRODUCTION_RUNBOOK.md`
> - 发布/回滚（唯一权威）：`../../../RUNBOOK.md`

---

## 1. 先说结论

当前 Admin Next 已不是纯 CSR，而是 **RSC(服务端入口) + Hydration + Client 交互组件** 的混合架构。  
方向正确，但仍存在以下可优化空间：

- 部分页面仍以客户端请求为主，首屏存在骨架等待
- 缓存策略相对统一，未按业务实时性分层
- 重交互组件较多，需继续做 chunk 拆分与惰性加载

---

## 2. 目标指标（验收口径）

以下指标用于阶段验收，按「关键后台页面」统计（Dashboard / Orders / Products / Finance / Users）：

| 指标                           | 当前基线（待补） | 目标（Phase 1） | 目标（Phase 2） |
| ------------------------------ | ---------------- | --------------- | --------------- |
| LCP（登录后关键页）            | -                | < 1.8s          | < 1.2s          |
| TBT                            | -                | < 250ms         | < 200ms         |
| CLS                            | -                | < 0.10          | < 0.05          |
| 列表筛选到首屏可见更新（命中） | -                | < 700ms         | < 500ms         |
| SSR 首屏请求失败率             | -                | < 1%            | < 0.5%          |

> 基线采集：按 `PRODUCTION_RUNBOOK.md` 执行 Lighthouse + 关键事务性能追踪（Sentry/日志）。

---

## 3. 页面分层策略（SSR/CSR 决策）

### 3.1 渲染边界原则

- **默认 Server Component**：页面壳、首屏可见统计、首屏列表数据
- **Client Component**：表格交互、筛选器、弹窗、编辑器、图表等浏览器交互
- **避免“整页 use client”**：Client 边界尽量下沉到叶子节点

### 3.2 数据缓存分层

- **强实时业务**（如支付状态、风控临界数据）：`revalidate: 0~5s`
- **常规运营列表**（订单、商品、用户）：`revalidate: 15~30s`
- **低频配置/统计**（系统配置、汇总看板）：`revalidate: 60~300s`

---

## 4. 分阶段执行计划

## Phase 0（0.5 天）：基线固化

1. 固定 5~8 个关键页面作为长期观测样本
2. 跑一轮生产 Lighthouse（3 runs/page）并存档
3. 记录当前首屏请求链路（SSR fetch、API RTT、失败率）

**产出物**：基线表（LCP/FCP/TBT/CLS + API 时延）

## Phase 1（1~2 天）：高收益页面首屏改造

优先确保「路由入口 Server 预取 + HydrationBoundary」模式在高频页统一落地：

- Orders / Products / Users / Finance / Dashboard
- 对尚未预取或预取不完整页进行补齐

**验收**：关键页首屏骨架时长显著下降，首屏请求瀑布减少

## Phase 2（2~3 天）：缓存与失效机制精细化

1. 为不同业务域建立 cache policy（按上文分层）
2. 使用 tag 失效进行精准刷新，减少全局无效刷新
3. 对高频突发接口增加失败重试与降级策略

**验收**：缓存命中率提升，后端峰值压力降低，数据新鲜度符合业务预期

## Phase 3（2~3 天）：Bundle 与交互流畅度治理

1. 跑 `build:analyze`，锁定 top 3 重 chunk
2. 对图表、富文本、低频面板进行动态加载（next/dynamic）
3. 优化大表格与筛选交互链路，降低主线程阻塞

**验收**：TBT 下降，页面操作卡顿减少

## Phase 4（持续）：质量闸门与回归机制

1. 将 Lighthouse 关键阈值纳入 CI（至少关键页面）
2. 建立每周性能回归检查（可自动化）
3. 变更评审模板增加“SSR/缓存策略”检查项

**验收**：性能不再随功能迭代持续回退

---

## 5. 优先级清单（建议）

### P0（必须先做）

- 关键页首屏统一预取策略（Orders/Products/Users/Finance/Dashboard）
- 缓存分层落地（强实时 vs 常规列表 vs 低频统计）

### P1（本轮建议完成）

- 重 chunk 拆分（图表/富文本/低频模块）
- 首屏骨架与真实内容切换一致性优化

### P2（持续优化）

- 细颗粒埋点与回归自动化
- 复杂交互路径（批量操作、大筛选）体验提升

---

## 6. 与 RUNBOOK 的边界

为避免重复维护，职责明确如下：

- 本文档：
  - 性能/体验目标
  - SSR/CSR 边界与优化路线
  - 验收指标与阶段计划
- `RUNBOOK.md`：
  - 发布、回滚、生产运维操作（唯一权威）
- Lighthouse 操作细节：
  - `apps/admin-next/scripts/lighthouse/PRODUCTION_RUNBOOK.md`

> 结论：本文是「优化策略文档」，不是「部署操作手册」。
