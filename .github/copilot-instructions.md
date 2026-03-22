# Lucky Nest Monorepo — Copilot 工作指令

> **重要**: 每次对话先看 `## 🎯 当前任务`，按 Phase 推进，不做计划外的事。

---

> **范围说明**：`apps/mini-shop-admin` 已弃用；默认忽略，不纳入日常排查、开发、测试与计划范围，除非用户明确要求。

## 🎯 当前任务（每次对话从这里开始）

**阶段**: Phase 6-IM Phase 2 — 多客服渠道 + Admin UI（支持后台创建多个客服）  
**上次停留**: BUSINESS 官方客服会话实时分发 Phase 1 已完成（2026-03-20）  
**立即执行**:

- [x] Phase 6 优先级调整：先落地「多客服渠道 + Admin UI（支持后台创建多个客服）」主线（OAuth/Email 登录链路顺延）
- [x] 设计落库：`apps/api/prisma/schema.prisma` 新增 `SupportChannel`（`id=businessId`、`botUserId`、`isActive`）并创建迁移
- [x] 新增后台渠道管理接口：`apps/api/src/admin/support-channel/*`（列表/创建/编辑/启停；创建时事务内自动创建 bot 用户）
- [x] 重构建联逻辑：`apps/api/src/common/chat/chat.service.ts` 将 `addMemberToBusinessGroup()` 从 BUSINESS 共享群改为 SUPPORT 1v1（按 `SupportChannel` 查 bot）
- [x] 补齐安全约束：`apps/api/src/common/chat/chat.service.ts` 的 `searchUsers` 增加 `isRobot: false` 过滤
- [x] 调整客服回复链路：`apps/api/src/admin/chat/admin-chat.service.ts` 通过 `chatService.sendMessage(botUserId, dto)` 发送，保留 `meta.realAdminId`
- [x] 调整 Admin 客服台默认会话类型为 SUPPORT：`apps/api/src/admin/chat/admin-chat.service.ts` + `apps/admin-next/src/views/CustomerServiceDesk.tsx`
- [x] 新增 Admin UI 渠道页：`apps/admin-next/src/app/(dashboard)/support-channels/page.tsx` + 对应 view/API/type（含侧边栏入口）
- [x] 清理实时分发特判：`apps/api/src/common/events/listeners/socket.listener.ts` 移除 `official_platform_support_v1` 硬编码依赖，走 SUPPORT 标准路径
- [x] 定向补测：后端（support-channel/chat/socket）+ 前端（SupportChannels/CustomerServiceDesk）最小回归通过
- [x] 种子数据补全：新增 `seed-support-channels.ts` 为 `official_platform_support_v1` 初始化虚拟 bot + SupportChannel 记录
- [x] Phase 6 延续（顺延）：前端 SDK 联调（Google/Facebook/Apple 按钮 + token 提交闭环）
- [x] 频控与安全（顺延）：邮箱验证码 TTL/重发限制/IP 限流/禁用万能码
- [x] 登录策略落地（顺延）：OAuth 主入口 + Email Code 次入口（文案和埋点同步）
- [x] 定向验收（顺延）：OAuth 联调自测 + Email OTP 接口单测 + 登录日志校验
- [x] Phase 6 插入：BUSINESS 官方客服会话实时分发方案（Phase 1，admin 无需 `join_chat`）
- [x] 后端改造：`chat.message.created` 针对 `official_platform_support_v1` 补发给在线客服 admin 私有房间（Phase 1）
- [x] 定向验收：Flutter 点击联系客服 + 用户发首条消息后，Admin Next 未选中会话也能收到实时刷新（Phase 1）
- [x] 影响评估：确认 Flutter 端无需协议改动（保持 `/chat/business` + `/chat/message/send`，Phase 1）
- [x] 后端收口：`apps/api/src/common/events/events.gateway.ts` + `apps/api/src/common/events/listeners/*` 定向清理完成（error 清零，scoped ESLint 通过）
- [x] 前端修复：`apps/admin-next/src/views/act-section/ActSectionBindProductModal.tsx` 修复 `ColumnDef` 类型报错 + `Cancel` 关闭行为 + 解绑按钮 loading 状态
- [x] 前端修复：`apps/admin-next/src/components/ui/SmartImage.tsx` 修复 `ImageProps` 合并导致的 TS2322 类型报错（保持现有渲染行为）
- [x] 后端收口：`apps/api/src/common/jwt/option-jwt.guard.ts` 清理 `OptionalJwtAuthGuard` lint 阻塞（scoped ESLint 通过）

> 最后对齐时间：2026-03-20（深夜同步）。Phase 6 OAuth/Email OTP 全部项已完成（Flutter SDK 联调 + 频控安全 + 登录策略 + 定向验收）。`deploy/.env.prod` 已补充 `GOOGLE_CLIENT_ID`（audience 强校验）。

---

## 🧹 Admin Next 路由 & 侧边栏清理（Phase 6 插入任务）

**背景**：路由目录/routes.ts/Sidebar 分组三处不对齐，积累了重复路由、无实体 hidden 占位、分组臃肿等问题，趁 Phase 2 完成后一次性整理。

- [x] 删除 `/login-log` 冗余目录（`app/(dashboard)/login-log/`）
- [x] 清理 `routes/index.ts`：删除 8 个无对应页面的 hidden 占位路由（`/service /lottery /activity /vip /admin-security /content /system /login-log`）
- [x] 重命名 `/im` → `/customer-service`：新建目录 + 旧目录加 `redirect()`
- [x] Sidebar 分组从 4 组重构为 8 组（Overview / Users / Catalog / Commerce / Marketing / Customer Service / Analytics / System）
- [x] 同步更新 `routes/index.ts` 的 `RouteGroup` 类型与所有 `group` 字段
- [x] 扁平化 `/act/section` → `/act-sections`（新目录 + 旧目录 redirect）
- [x] 扁平化 `/payment/channels` → `/payment-channels`（新目录 + 旧目录 redirect）

---

## 🎓 Admin Next — Next.js 重构蜕变路线图（闯关式）

> **规则**：一次只推进一关；每关必须完成「底层破局点 + T0/T1/T2 时间线 + 随堂测验」三模块后才能开启下一关。  
> 详细教学内容见 `read/ADMIN_NEXT_SSR_CSR_REVIEW_CN.md` 第七节。

- [x] Stage 1 — Edge Middleware 路由鉴权：消灭 Auth Flashing（`middleware.ts` + `layout.tsx` 双层守卫）
- [x] Stage 2 — async Server Component + Suspense Streaming（`DashboardStats` / `AnalyticsOverview`）
- [x] Stage 3 — URL searchParams 驱动 filter + HydrationBoundary（10 个列表页已迁移）
- [x] **Stage 4（已完成）** — Client 边界最小化：Finance Stats SSR + 删除 console.log 生产泄漏
  - [x] 删除 `views/FinancePage.tsx` 第 56 行 `console.log('FinancePage statistics:', statistics)`（生产安全 🔴）
  - [x] 删除 `views/FinancePage.tsx` 内 `StatsCard` 子组件中的 `console.log('StatsCard trendValue:', ...)`
  - [x] 新建 `components/finance/FinanceStatsServer.tsx`（async Server Component，serverGet 直出统计数字，`revalidate: false`）
  - [x] 新建 `components/finance/FinanceRefreshButton.tsx`（Client Component，`router.refresh()` 触发 Server Component 重渲染）
  - [x] 更新 `app/(dashboard)/finance/page.tsx`：双 Suspense 层（FinanceStatsServer + FinanceClient 并行流式）
  - [x] `views/FinancePage.tsx` 精简为纯 Tabs Client Component，移除所有 stats 相关逻辑
  - [x] 随堂测验答案：「手动刷新按钮调用 `router.refresh()`，Next.js 重新执行所有 async Server Component，无需整页跳转」
- [ ] **Stage 5（当前关卡）** — Suspense 包裹剩余 9 个"裸页"（ads / flash-sale / settings / notifications / lucky-draw / categories / login-logs / support-channels / customer-service）
- [ ] Stage 6 — `views/` 目录哲学收口：`views/` 只保留 Modal/Form，完整页面迁移到 `components/*Client.tsx`

---

## 🛡️ CI / 本地质量闸门（上下文保留，2026-03-20）

- [x] 根仓库已接入 Husky：提交前走 `lint:staged`，推送前按分支执行轻/重检查（见 `package.json`、`.husky/pre-commit`、`.husky/pre-push`）
- [x] 本地轻量闸门已落地：`prepush:light` 覆盖 `@repo/ui` + `@lucky/admin-next` 的 `lint` / `check-types`
- [x] 本地重量闸门已落地：`prepush:heavy` 在轻量检查基础上追加 `@lucky/admin-next` 单测
- [x] staged 文件质量路由已落地：`lint-staged.config.mjs` 按工作区分流 `Prettier` / `ESLint --fix`，降低 CI 噪音（当前覆盖 `apps/admin-next` / `apps/api` / `packages/ui` / `apps/liveness-web`，跳过 `apps/mini-shop-admin`）
- [x] CI 基线已固定：`.github/workflows/ci.yml` 先跑 install + Prisma generate，再跑 lint / typecheck / unit test；Playwright E2E 保持可选执行
- [x] Cloudflare Admin 部署工作流已修正 Yarn 4 / Corepack 兼容问题：移除 `setup-node` 的 `cache: yarn`，避免 runner 上 Yarn 1 抢占
- [x] `deploy-backend.yml` / `deploy-admin.yml` 已支持自动同步 `deploy/*.sh` 到 VPS，避免服务器脚本滞后
- [x] `RUNBOOK.md` 已同步本地提交前校验、分支级 pre-push 策略与跳过 hook 规则
- [x] `@repo/ui` 与 `@lucky/admin-next` 当前本地关键检查已打通：`lint` / `check-types` 通过，`admin-next` 单测通过
- [x] 已完成本地全量质量检查（排除 `apps/mini-shop-admin`）：其余工作区按当前闸门策略执行完毕
- [x] 当前阻塞已解除：`@lucky/shared` 的 `check-types` TypeScript 可执行路径解析问题已修复
- [ ] `@lucky/api` lint debt 规模较大，按模块分批清理后再纳入本地重闸门（`prepush:heavy` 或独立后端检查）
- [ ] 评估将 CI 中 `Lint` 从 `continue-on-error` 收紧为硬性失败门槛，避免 lint 问题继续后移
- [ ] 等 GHA 缓存方案恢复后，重新启用 Yarn / node_modules / Playwright / Turbo 缓存，缩短质量闸门耗时

> 详细命令与排障说明见 `RUNBOOK.md` 6.3；CI 现状以 `.github/workflows/ci.yml` 为准。

---

## 一、项目全景

| 维度                     | 详情                                                                           |
| ------------------------ | ------------------------------------------------------------------------------ |
| **仓库结构**             | Yarn 4 Workspace + Turborepo Monorepo                                          |
| **后端**                 | `apps/api` — NestJS + Prisma + PostgreSQL + Redis                              |
| **Admin 前端**           | `apps/admin-next` — Next.js 15 (standalone) + React 19 + Tailwind CSS v4       |
| **小程序商城（已弃用）** | `apps/mini-shop-admin` — Vue 3 + Vite + UnoCSS（默认忽略，除非明确要求）       |
| **共享包**               | `packages/ui` (React 组件库), `packages/shared` (工具/常量), `packages/config` |
| **生产服务器**           | VPS Ubuntu 22.04, 1 GB RAM, 1 CPU, San Jose CA                                 |
| **生产域名**             | `admin.joyminis.com` / `api.joyminis.com`                                      |
| **开发域名**             | `admin-dev.joyminis.com` / 本地 API `http://localhost:3000`                    |
| **镜像仓库**             | GHCR `ghcr.io/mrbigporter/lucky-{backend,admin-next}-prod`                     |
| **VPS 目录**             | `/opt/lucky`                                                                   |

---

## 二、关键技术约定（违反会报错或出安全问题）

### ⚠️ 表单规范（必须遵守）

- 使用 `react-hook-form` + `zod` + `@hookform/resolvers@5`
- **禁止** Zod schema 用 `.default()` → 改用 `useForm({ defaultValues: {...} })`
- **禁止** Zod schema 用 `.transform()` → 在 submit handler 里手动转换
- 原因: v5 严格类型约束，input/output 类型不一致会报 TS2322

### 后端规范

- Admin 接口路径统一 `/admin/*`，受 `AdminJwtAuthGuard` + `RolesGuard` 保护
- JWT 双密钥: `JWT_SECRET`（客户端）/ `ADMIN_JWT_SECRET`（后台）
- 新接口必须有对应 TS 类型定义（`src/api/types.ts` 或模块 type 文件）
- 数据库变更走 `prisma migrate dev`，不直接改库
- 环境变量: `deploy/.env.dev` (开发) / `deploy/.env.prod` (生产)
- 超级管理员: `yarn workspace @lucky/api cli:create-admin`

### 前端规范

- 认证 token: `localStorage('auth_token')` + Cookie `auth_token`（middleware 读 Cookie）
- 主题: `useAppStore` zustand/persist, key=`app-store`, 值=`dark`/`light`
- API 地址: 环境变量 `NEXT_PUBLIC_API_BASE_URL`
- 多语言: `useAppStore.lang`，支持 `en`/`zh`，翻译表在 `src/constants.ts`
- 数据请求: `ahooks/useRequest`（当前）/ `@tanstack/react-query`（Phase 2 引入）
- 修改 `packages/ui` → 必须运行 `node packages/ui/scripts/build.js`
- 修改 `packages/shared` → 必须运行 `node packages/shared/scripts/build.js`

### ⚠️ 测试规范（违反会导致 CI 红灯）

> 完整规范见 `read/TESTING_STANDARDS_CN.md`（含调试流程、错误速查表、模板）

**高频禁令（快速记忆）：**

- **禁止同一文件存在两个同名 `describe` 块** → 旧版必须完整删除
- **`React.forwardRef` 在 `vi.mock` 里必须用工厂函数写法并设 `.displayName`**
- **所有 E2E 文件必须从 `'./fixtures'` 导入 `test`**，不能从 `'@playwright/test'`
- **API 签名 / store action 参数改变时，立即同步所有 `toHaveBeenCalledWith` 和 `mockResolvedValue`**
- **文件末尾只允许一个 `\n`**，禁止两个以上空行
- **长函数调用超过 80 字符必须拆行 + trailing comma**

### ⚠️ Monorepo TypeScript 规范（违反会导致 Docker 构建产物路径错误）

> 事故记录：2026-03-21，`dist/main.js` 变成 `dist/apps/api/src/main.js`，容器启动失败  
> 详细复盘见 `read/DEPLOY_INCIDENT_20260321_CN.md`（问题 6c/rootDir 章节）

**核心规则（必须记住）：**

- **`paths` 里的跨包引用必须指向 `dist/`（`.d.ts`），不能指向 `src/`（`.ts`）**
- `.ts` 源文件被 `paths` 引用 → TypeScript 把它纳入编译输出 → `rootDir` 被推断到 monorepo 根 → 所有输出路径错误嵌套

```jsonc
// ❌ 错误：指向 .ts 源码，会导致 rootDir 推断偏移
"@lucky/shared": ["../../packages/shared/src/index.ts"]

// ✅ 正确：指向 dist/ 声明文件，只用于类型检查，不影响编译输出
"@lucky/shared": ["../../packages/shared/dist/index"]
```

**`tsconfig.build.json` 必须只含 `src/`：**

```jsonc
// apps/api/tsconfig.build.json — nest build 专用
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "declaration": false },
  "include": ["src/**/*"], // ← 只编译 src/，不能有 scripts/
  "exclude": ["node_modules", "dist", "test", "scripts", "**/*.spec.ts"],
}
// tsconfig.json 保留 scripts/ 供 check-types / IDE 使用（--noEmit 不受 rootDir 影响）
```

**症状速查（发现这些立即检查 tsconfig）：**

| 症状                        | 根因                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| `dist/apps/api/src/main.js` | `paths` 指向 `.ts`，rootDir 推断到 monorepo 根                      |
| `dist/src/main.js`          | `tsconfig.build.json` 包含了 `scripts/`，rootDir 推断到 `apps/api/` |
| `dist/main.js` ✅           | 正确，`tsconfig.build.json` 只含 `src/`                             |

**修改 `packages/shared` 后的必要操作（保持 `dist/` 最新）：**

```bash
node packages/shared/scripts/build.js   # 重建 dist/，IDE 和 API 的类型才同步
```

### ⚠️ Prisma v6 规范（违反会导致容器崩溃或大量 TS 报错）

> 事故记录：2026-03-17，Apple Silicon Docker 容器启动崩溃 + 187 个 TS 错误  
> 详细复盘见 `read/PRISMA_V6_MIGRATION_CN.md`

**引擎 binary（必须保持，否则容器启动崩溃）**

- `binaryTargets` 必须包含 `"linux-arm64-openssl-1.1.x"`（base image = `node:20-bullseye-slim`，OpenSSL 1.1.x）
- 当前正确值：`["native", "debian-openssl-3.0.x", "linux-musl-openssl-3.0.x", "linux-arm64-openssl-1.1.x"]`
- **禁止** 为 `apps/api/node_modules` 单独添加 Docker 卷 → 会导致 Prisma generated client 为空，所有模型类型消失

**Prisma v6 API 变更（用 v5 写法会报 TS 错误）**

| v5 写法 ❌                             | v6 正确写法 ✅                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `Prisma.LogDefinition`                 | 本地定义等价类型（见 `prisma.service.ts`）                                       |
| `$queryRawUnsafe<T>(...)`              | `await $queryRawUnsafe(...)` 后再 `as T`                                         |
| `Prisma.PrismaClientKnownRequestError` | `import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'` |
| `catch (e: any)` + `e.message`         | `catch (e: unknown)` + `e instanceof Error ? e.message : String(e)`              |
| JSON 字段写 `null`                     | `Prisma.JsonNull`（nullable JSON 字段不接受 JS 原生 null）                       |

**修改 `schema.prisma` 后的必要操作**

```bash
# 1. 宿主机重新 generate（IDE 和 ESLint 才能看到新类型，否则大量假报错）
node apps/api/node_modules/.bin/prisma generate --schema apps/api/prisma/schema.prisma
# 2. 重启容器（让 prestart:dev 在容器内也重新 generate）
docker compose --env-file deploy/.env.dev up -d backend
```

### CI/CD 文件速查

| 文件                                   | 触发           | 作用                             |
| -------------------------------------- | -------------- | -------------------------------- |
| `.github/workflows/ci.yml`             | PR / push main | Lint + 类型检查 + 单元测试 + E2E |
| `.github/workflows/deploy-backend.yml` | push main      | 后端镜像 → GHCR → VPS            |
| `.github/workflows/deploy-admin.yml`   | push main      | Admin 镜像 → GHCR → VPS          |
| `.github/workflows/deploy-master.yml`  | 手动触发       | 全量部署                         |

### 本地开发

```bash
make up    # 启动所有容器
make logs  # 查看日志
make down  # 停止容器
# 重建 admin-next（依赖变化时）:
docker rm -f lucky-admin-next-dev
docker volume rm lucky_nest_monorepo_admin_next_build lucky_nest_monorepo_admin_next_nm
docker compose --env-file deploy/.env.dev up -d admin-next
```

---

## 三、迭代历史

| Phase     | 内容摘要                                                                                                                | 完成日期   |
| --------- | ----------------------------------------------------------------------------------------------------------------------- | ---------- |
| Phase 0   | standalone 部署 · FOUC 防闪烁 · Dockerfile · Nginx · CI/CD 迁 VPS · SSR 修复 · TS 类型修复                              | 2026-03-16 |
| Phase 1   | HTTP-only Cookie 认证 · 服务端路由守卫 · XSS 风险消除                                                                   | 2026-03-16 |
| Phase 2   | Dashboard SSR 数据预取 · react-query · HydrationBoundary · 内网直连                                                     | 2026-03-16 |
| Phase 3   | 列表页 Hybrid 模式 · URL searchParams 驱动 filter                                                                       | 2026-03-16 |
| Phase 5   | 广告/秒杀/系统配置/IM客服/登录日志 — 后端+前端全部补齐，Socket 实时升级                                                 | 2026-03-17 |
| Phase 5.5 | 注册申请功能 — 6层防御(reCAPTCHA/IP限流/域名黑名单/冲突检查) + Resend邮件通知 + 前端申请表单 + 超管审批页 + Sidebar红点 | 2026-03-17 |

> 详细改造记录见 `read/` 目录下各 Phase 文档。

---

## 四、业务功能状态（23 项全部完成）

登录登出 · 后台用户管理 · Banner · 分类 · 产品 · 订单 · 用户+KYC · 财务（充值/提现/审核）· 支付渠道 · 优惠券 · Act Section · 地址 · 拼团 · 操作日志审计 · RBAC 权限角色管理 · 数据分析仪表板 · 通知/推送管理 · 广告管理 · 秒杀活动 · 系统配置 · IM 客服接待台 · 登录日志 · **注册申请（含超管审批 + 邮件通知 + reCAPTCHA）**

---

## 五、Phase 6 — 待规划

> 从下表选定方向后，在 `🎯 当前任务` 区块展开为具体 checkbox 再开始执行。

| 候选项              | 说明                                                   | 优先级 |
| ------------------- | ------------------------------------------------------ | ------ |
| Lighthouse 性能验收 | 验证 LCP < 500ms（Phase 2 遗留）                       | 🔴 高  |
| 移动端响应式适配    | Admin 页面在平板/手机上的布局优化                      | 🟡 中  |
| 批量操作            | 订单/用户批量状态变更、批量导出 CSV                    | 🟡 中  |
| 国际化完善          | 所有新增页面补充 `zh` 翻译 key                         | 🟡 中  |
| E2E 覆盖率提升      | 为 CRUD 新建流程补充完整表单填写 + 提交测试            | 🟢 低  |
| 单元测试补全        | Phase 5 新 view 组件（AdsManagement 等）补 Vitest 测试 | 🟢 低  |

---

## 六、已知风险

| 问题                                                              | 级别  | 状态                                                                                                           |
| ----------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------- |
| `auth_token` Cookie 非 HTTP-only，XSS 可窃取 token                | 🔴 高 | ✅ Phase 1 已修复                                                                                              |
| VPS 1GB RAM，Docker 镜像过多可能 OOM                              | 🔴 高 | 已用 Alpine + standalone 优化，持续监控                                                                        |
| Firebase SDK JSON 格式错误（韩文字符在环境变量中）                | 🟡 中 | ✅ 已修复                                                                                                      |
| `middleware.ts` 注释过时                                          | 🟡 中 | ✅ Phase 0 已修复                                                                                              |
| Prisma 模型加了但没跑 generate → 运行时 `prisma.xxx` 为 undefined | 🔴 高 | ✅ Phase 5.5 已修复：entrypoint.sh 默认跑 migrate deploy；compose.yml dev 也加了 migrate deploy                |
| CI 缓存已禁用（GHA 存储不足），每次全量安装慢                     | 🟢 低 | 待迁移 Docker Hub 后重启缓存                                                                                   |
| 引擎 binary 配置缺失导致容器崩溃                                  | 🔴 高 | ✅ Phase 6 已修复：`schema.prisma` 添加 `"linux-arm64-openssl-1.1.x"`；禁止单独挂载 `apps/api/node_modules` 卷 |
| Prisma v6 breaking changes 导致 TS 错误                           | 🔴 高 | ✅ Phase 6 已修复：见二、关键技术约定 Prisma v6 规范                                                           |

---

## 七、工作原则（每次对话必须遵守）

1. **先看 `🎯 当前任务` → 确认 Phase → 再动手**，不做 Phase 之外的事
2. **每完成一个 checkbox 立即更新本文件**（`[ ]` → `[x]`），保持进度同步
3. 修改 `packages/ui` → 必须 `node packages/ui/scripts/build.js`
4. 修改 `packages/shared` → 必须 `node packages/shared/scripts/build.js`
5. Zod schema **禁止** `.default()` 和 `.transform()`（见技术约定）
6. 生产部署前检查 `deploy/.env.prod` 包含所有必需变量
7. 数据库变更必须通过 `prisma migrate dev` 生成迁移文件
8. 新增 API 接口必须有 TS 类型定义（`src/api/types.ts` 或模块 type 文件）
9. **新增 Prisma 模型后，本地必须重启 backend 容器**（`docker compose --env-file deploy/.env.dev up -d backend`）让 `prestart:dev` 重跑 `prisma generate`；生产走 CI/CD 重建镜像自动处理
10. 修改 `schema.prisma` 后，**必须在宿主机跑一次** `node apps/api/node_modules/.bin/prisma generate --schema apps/api/prisma/schema.prisma`（让 IDE / ESLint 看到最新类型，否则会出现大量假报错）
11. `apps/mini-shop-admin` 已弃用；除非用户明确点名，否则默认不阅读、不修改、不纳入计划。
