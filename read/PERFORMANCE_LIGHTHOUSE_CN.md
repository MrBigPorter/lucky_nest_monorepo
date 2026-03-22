# Admin Next — Lighthouse 性能验收标准

> **目的**：量化 Stage 1~6 重构的实际性能收益，确认 LCP < 500ms（内网）目标，找出剩余瓶颈。  
> **建立日期**：2026-03-22  
> **适用环境**：`https://admin.joyminis.com`（生产）

---

## 一、为什么要做性能验收

Stage 2（async RSC）和 Stage 4（Finance SSR）做完后，我们从未实际测量过效果。  
Lighthouse 验收回答三个问题：

1. SSR 优化是否真的减少了首屏时间？（Dashboard vs Orders 对比）
2. Suspense 骨架屏是否消灭了 CLS 布局偏移？
3. 还有没有未被发现的性能瓶颈？

---

## 二、指标定义与通过标准

### Core Web Vitals

| 指标    | 全称                     | 含义                                     | 内网目标    | 外网目标（Google 标准） |
| ------- | ------------------------ | ---------------------------------------- | ----------- | ----------------------- |
| **LCP** | Largest Contentful Paint | 最大内容绘制时间（用户感知"页面加载完"） | **< 500ms** | < 2.5s                  |
| **FCP** | First Contentful Paint   | 首次有内容显示（白屏结束）               | **< 200ms** | < 1.8s                  |
| **TBT** | Total Blocking Time      | JS 阻塞主线程的总时间（影响可交互性）    | **< 200ms** | < 200ms                 |
| **CLS** | Cumulative Layout Shift  | 布局偏移分数（元素是否乱跳）             | **< 0.1**   | < 0.1                   |

> **注**：内网目标更严格，因为 VPS 在 San Jose，API 内网直连延迟约 5ms。  
> 如果内网达标但外网不达标，瓶颈在网络传输而非代码，需要 CDN / Edge。

---

## 三、测试方法（必须严格遵守，否则数据无效）

### 3.1 环境准备

```
1. 使用 Chrome 无痕模式（Ctrl+Shift+N）
   原因：普通窗口有插件（广告拦截/翻译等），干扰网络请求和 JS 执行

2. 关闭其他占用网络的程序（视频/下载等）

3. 确保已登录 admin.joyminis.com（Lighthouse 测的是登录后的页面）

4. 每个页面跑 3 次，取中间值（第1次可能有冷启动偏差）
```

### 3.2 Lighthouse 配置

```
DevTools（F12）→ Lighthouse 标签

✅ 勾选：Performance（只勾这一个）
❌ 取消：Accessibility / Best practices / SEO / PWA

Device：Desktop（后台系统，不测移动端）
Throttling：No throttling（内网测试，不模拟慢网）
```

### 3.3 测试顺序

按以下顺序测，每次测完截图保存分数：

```
1. /login          ← 无需登录，冷启动基准
2. /              ← Dashboard（SSR 页，应该最快）
3. /analytics     ← Analytics（SSR 页，对比 Dashboard）
4. /finance       ← Finance（SSR 统计 + Client 列表）
5. /orders        ← Orders（纯 Client，作为对照基准）
```

---

## 四、结果记录表

> 测试完成后填入此表，精确到 ms。

### 测试日期：****\_\_\_****

| 页面          | LCP (ms) | FCP (ms) | TBT (ms) | CLS | 评级 | 备注 |
| ------------- | -------- | -------- | -------- | --- | ---- | ---- |
| `/login`      |          |          |          |     |      |      |
| `/` Dashboard |          |          |          |     |      |      |
| `/analytics`  |          |          |          |     |      |      |
| `/finance`    |          |          |          |     |      |      |
| `/orders`     |          |          |          |     |      |      |

### 评级规则

| 评级          | 颜色 | LCP 条件       |
| ------------- | ---- | -------------- |
| 优秀 ✅       | 绿   | < 500ms        |
| 待优化 🟡     | 橙   | 500ms ~ 1500ms |
| 需立即处理 🔴 | 红   | > 1500ms       |

---

## 五、预期结果与分析逻辑

### 5.1 如果结果符合预期（SSR 有效）

```
Dashboard LCP ≪ Orders LCP（差距 > 300ms）
  → Stage 2 async RSC 生效，SSR 确实加速了首屏
  → 下一步：验收通过，可以转向功能方向（移动端/批量操作）
```

### 5.2 如果 Dashboard 和 Orders 速度差不多

```
Dashboard LCP ≈ Orders LCP（差距 < 100ms）
  → SSR 没有产生预期效果，需要排查原因：

  可能原因 1：DashboardStats 的 serverGet() 请求很慢
    → 检查 VPS API 响应时间（curl 测 /v1/admin/finance/statistics）

  可能原因 2：LCP 元素不是统计卡片，而是别的元素（侧边栏/图片）
    → 看 Lighthouse 报告里 LCP 标记的是哪个 DOM 元素

  可能原因 3：JS bundle 太大，hydration 阻塞了感知
    → 看 TBT，如果 > 500ms 说明 JS 太重
```

### 5.3 如果 CLS > 0.1

```
骨架屏（Stage 5）没有完全消灭布局偏移
  → 看 Lighthouse 报告里哪个元素在偏移
  → 给该元素加固定高度或 min-height
```

### 5.4 如果 TBT > 500ms

```
JS bundle 太重，主线程阻塞严重
  → 检查是否有大型第三方库没有做 code splitting
  → 考虑 dynamic import() 懒加载非首屏组件
```

---

## 六、优化决策树

```
跑完 Lighthouse
       │
       ├─ LCP < 500ms（5个页面都达标）
       │    └─ ✅ 验收通过 → 转功能方向
       │         推荐：移动端适配 / 批量操作
       │
       ├─ Dashboard LCP < 500ms，但 Orders LCP > 1500ms
       │    └─ 🟡 SSR 有效，列表页慢是正常的
       │         可接受，但如果要优化：HydrationBoundary 预取第一页数据
       │
       ├─ Dashboard LCP > 1000ms（SSR 没生效）
       │    └─ 🔴 需要排查 serverGet() 内网延迟
       │         curl -w "%{time_total}" https://api.joyminis.com/v1/admin/finance/statistics
       │
       └─ TBT > 500ms（所有页面）
            └─ 🔴 JS bundle 问题
                 运行：yarn workspace @lucky/admin-next build
                 查看 .next/analyze/ 包体积报告
```

---

## 七、后续追踪

每次重大性能优化后，在此文档追加一条测试记录：

```markdown
### 测试记录 #1 — 2026-03-22（Stage 1~6 完成后基准测试）

| Dashboard LCP | Analytics LCP | Finance LCP | Orders LCP |
| **_ ms | _** ms | **_ ms | _** ms |
结论：\_\_\_
```

---

## 附：LCP 是什么意思（直觉理解）

> 打开 Dashboard，你"感觉"页面加载完了——是在你看到统计数字的那一刻。  
> LCP 就是测量这个时刻距离你按下回车有多久。
>
> **SSR 的价值**：没有 SSR 时，你要等 JS 加载 + API 请求 = 约 500ms 后才看到数字。  
> 有了 SSR，数字直接在 HTML 里，你可能 80ms 就看到了。
