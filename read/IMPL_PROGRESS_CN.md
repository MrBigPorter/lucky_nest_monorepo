# 实现进度追踪 — 开奖 / 秒杀集成 / 福利抽奖

> **断点续作说明**：每次对话从本文件的 `## 🔴 当前断点` 区块开始，确认最后完成的文件后继续。  
> 打勾规则：文件写完且无 TS 错误 → `[ ]` 改 `[x]`，同时在行尾加 ✅

---

## 🔴 当前断点

**最后完成**：Step 4 — LuckyDrawService + LotteryService 均已创建，无真实 TS 错误  
**下一步**：Step 5 — GroupModule 接入（接入 LotteryService.drawWinner + LuckyDrawService.issueTicketsForGroup）

---

## 一、完整架构文件树

### 后端 `apps/api`

```
prisma/
└── schema.prisma                          ← 修改：新增 7 处

src/
├── common/
│   ├── lottery/                           ← 新建目录（开奖）
│   │   ├── lottery.service.ts
│   │   └── lottery.module.ts
│   └── lucky-draw/                        ← 新建目录（福利抽奖核心）
│       ├── lucky-draw.service.ts
│       └── lucky-draw.module.ts
│
├── admin/
│   ├── admin.module.ts                    ← 修改：imports AdminLuckyDrawModule
│   └── lucky-draw/                        ← 新建目录
│       ├── dto/
│       │   ├── create-activity.dto.ts
│       │   ├── update-activity.dto.ts
│       │   ├── create-prize.dto.ts
│       │   └── update-prize.dto.ts
│       ├── lucky-draw.controller.ts
│       ├── lucky-draw.service.ts
│       └── lucky-draw.module.ts
│
└── client/
    ├── client.module.ts                   ← 修改：imports ClientLuckyDrawModule
    ├── orders/
    │   ├── dto/
    │   │   └── checkout.dto.ts            ← 修改：加 flashSaleProductId?
    │   └── order.service.ts               ← 修改：秒杀价注入 + refund 恢复库存
    ├── group/
    │   └── group.service.ts               ← 修改（或 group.processor.ts）：接入 drawWinner + issueTicketsForGroup
    └── lucky-draw/                        ← 新建目录
        ├── dto/
        │   └── query-tickets.dto.ts
        ├── lucky-draw.controller.ts
        └── lucky-draw.module.ts
```

### Admin 前端 `apps/admin-next`

```
src/
├── type/types.ts                          ← 修改：追加 Lucky Draw 类型 + @deprecated 旧类型
├── api/index.ts                           ← 修改：追加 luckyDrawApi
├── constants.ts                           ← 修改：追加 luckyDraw 翻译 key
├── routes/index.ts                        ← 修改：追加 /lucky-draw 路由（Sparkles 图标）
├── app/(dashboard)/
│   └── lucky-draw/
│       └── page.tsx                       ← 新建
└── views/
    └── LuckyDrawManagement.tsx            ← 新建（主视图）
```

---

## 二、Step 1 — Schema（`prisma/schema.prisma`）

### 已完成的修改
- [x] `Treasure` 追加 `luckyDrawActivities LuckyDrawActivity[]` ✅
- [x] `TreasureGroup` 追加 `lotteryResults LotteryResult[]` ✅
- [x] `Coupon` 追加 `luckyDrawPrizes LuckyDrawPrize[]` ✅

### 待完成
- [x] `User` 追加 3 个反向关联（`lotteryResults / luckyDrawTickets / luckyDrawResults`）✅
- [x] `Order` 追加 `flashSaleProductId String?` 字段 ✅
- [x] `FlashSaleProduct` 追加 `orders Order[]` 反向关联 ✅
- [x] 新增 `LotteryResult` 模型（开奖结果表）✅
- [x] 新增 `LuckyDrawActivity` 模型（抽奖活动表）✅
- [x] 新增 `LuckyDrawPrize` 模型（奖品配置表）✅
- [x] 新增 `LuckyDrawTicket` 模型（抽奖券表）✅
- [x] 新增 `LuckyDrawResult` 模型（抽奖结果表）✅
- [x] 宿主机执行 `prisma generate` ✅
- [x] 容器内执行 `prisma migrate dev --name add_lottery_and_lucky_draw` ✅（迁移文件：`20260318032805_add_lottery_and_lucky_draw`）
- [ ] 重启 backend 容器（Step 5 接入 GroupModule 后统一重启）

---

## 三、Step 2 — 秒杀下单集成

- [x] `client/orders/dto/checkout.dto.ts` — 加 `flashSaleProductId?` ✅
- [x] `client/orders/order.service.ts` — `checkOut` 插入秒杀价格校验 + 原子扣库存 ✅
- [x] `common/group/group.service.ts` — `refundSingleOrder` 恢复 `flashStock` ✅

---

## 四、Step 3 — LotteryService（开奖核心）

- [x] `common/lottery/lottery.service.ts` — `drawWinner(groupId, tx)` 实现 ✅
- [x] `common/lottery/lottery.module.ts` — exports `LotteryService` ✅

---

## 五、Step 4 — LuckyDrawService（福利抽奖核心）

- [x] `common/lucky-draw/lucky-draw.service.ts` ✅
  - [x] `issueTicketsForGroup(groupId)` ✅
  - [x] `issueTicketForOrder(userId, treasureId, orderId)` ✅
  - [x] `draw(userId, ticketId)` ✅
- [x] `common/lucky-draw/lucky-draw.module.ts` — exports `LuckyDrawService` ✅

---

## 六、Step 5 — GroupModule 接入

- [ ] `common/group/group.module.ts`（或 client/group）— imports `LotteryModule` + `LuckyDrawModule`
- [ ] `GroupProcessor`（或 group.service.ts）— 替换批量 WAIT_DELIVERY → `drawWinner` + `issueTicketsForGroup`

---

## 七、Step 6 — OrderService 接入（单买发券）

- [ ] `client/orders/order.service.ts` — `checkOut` 事务外 fire-and-forget `issueTicketForOrder`

---

## 八、Step 7 — Admin 抽奖模块

- [ ] `admin/lucky-draw/dto/create-activity.dto.ts`
- [ ] `admin/lucky-draw/dto/update-activity.dto.ts`
- [ ] `admin/lucky-draw/dto/create-prize.dto.ts`
- [ ] `admin/lucky-draw/dto/update-prize.dto.ts`
- [ ] `admin/lucky-draw/lucky-draw.service.ts`（活动/奖品 CRUD + 结果分页，JOIN treasureName/couponName）
- [ ] `admin/lucky-draw/lucky-draw.controller.ts`（`@UseGuards(AdminJwtAuthGuard, RolesGuard)`）
- [ ] `admin/lucky-draw/lucky-draw.module.ts`
- [ ] `admin/admin.module.ts` — imports `AdminLuckyDrawModule`

---

## 九、Step 8 — Client 抽奖模块

- [ ] `client/lucky-draw/dto/query-tickets.dto.ts`
- [ ] `client/lucky-draw/lucky-draw.controller.ts`（`my-tickets / draw / my-results`，加 `JwtAuthGuard`）
- [ ] `client/lucky-draw/lucky-draw.module.ts`（imports `LuckyDrawModule` + `WalletModule` + `CouponModule`）
- [ ] `client/client.module.ts` — imports `ClientLuckyDrawModule`

---

## 十、Step 9 — Admin Next.js 前端

- [ ] `type/types.ts` — 追加 Lucky Draw 类型；旧 `LotteryDraw / LotteryActivity` 加 `@deprecated`
- [ ] `api/index.ts` — 追加 `luckyDrawApi`
- [ ] `constants.ts` — 追加 `luckyDraw` 翻译 key（en + zh）
- [ ] `routes/index.ts` — 追加 `/lucky-draw`（`Sparkles` 图标）
- [ ] `app/(dashboard)/lucky-draw/page.tsx` — 路由入口
- [ ] `views/LuckyDrawManagement.tsx`
  - [ ] `ActivityModal`（react-hook-form + zodResolver + defaultValues）
  - [ ] `PrizeModal`（watch prizeType 动态字段）
  - [ ] `PrizesPanel`（useRequest + 概率合计校验 + 结果表格）
  - [ ] 主组件双栏布局

---

## 十一、完成后必做

- [ ] `node packages/ui/scripts/build.js`（若修改了 packages/ui）
- [ ] `node packages/shared/scripts/build.js`（若修改了 packages/shared）
- [ ] `docker compose --env-file deploy/.env.dev up -d backend`（重启 backend）

