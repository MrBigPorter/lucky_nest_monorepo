# Lucky Nest Monorepo — Copilot 工作指令

> **重要**: 每次对话先看 `## 🎯 当前任务`，按 Phase 推进，不做计划外的事。

---

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
- [ ] Phase 6 延续（顺延）：前端 SDK 联调（Google/Facebook/Apple 按钮 + token 提交闭环）
- [ ] 频控与安全（顺延）：邮箱验证码 TTL/重发限制/IP 限流/禁用万能码
- [ ] 登录策略落地（顺延）：OAuth 主入口 + Email Code 次入口（文案和埋点同步）
- [ ] 定向验收（顺延）：OAuth 联调自测 + Email OTP 接口单测 + 登录日志校验
- [x] Phase 6 插入：BUSINESS 官方客服会话实时分发方案（Phase 1，admin 无需 `join_chat`）
- [x] 后端改造：`chat.message.created` 针对 `official_platform_support_v1` 补发给在线客服 admin 私有房间（Phase 1）
- [x] 定向验收：Flutter 点击联系客服 + 用户发首条消息后，Admin Next 未选中会话也能收到实时刷新（Phase 1）
- [x] 影响评估：确认 Flutter 端无需协议改动（保持 `/chat/business` + `/chat/message/send`，Phase 1）

> 最后对齐时间：2026-03-20。当前优先级已切换到 Phase 6-IM Phase 2（多客服渠道 + Admin UI），OAuth/Email 未完成项按顺延标记处理。

---

## 一、项目全景

| 维度 | 详情 |
|------|------|
| **仓库结构** | Yarn 4 Workspace + Turborepo Monorepo |
| **后端** | `apps/api` — NestJS + Prisma + PostgreSQL + Redis |
| **Admin 前端** | `apps/admin-next` — Next.js 15 (standalone) + React 19 + Tailwind CSS v4 |
| **小程序商城** | `apps/mini-shop-admin` — Vue 3 + Vite + UnoCSS |
| **共享包** | `packages/ui` (React 组件库), `packages/shared` (工具/常量), `packages/config` |
| **生产服务器** | VPS Ubuntu 22.04, 1 GB RAM, 1 CPU, San Jose CA |
| **生产域名** | `admin.joyminis.com` / `api.joyminis.com` |
| **开发域名** | `admin-dev.joyminis.com` / 本地 API `http://localhost:3000` |
| **镜像仓库** | GHCR `ghcr.io/mrbigporter/lucky-{backend,admin-next}-prod` |
| **VPS 目录** | `/opt/lucky` |

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

### ⚠️ Prisma v6 规范（违反会导致容器崩溃或大量 TS 报错）

> 事故记录：2026-03-17，Apple Silicon Docker 容器启动崩溃 + 187 个 TS 错误  
> 详细复盘见 `read/PRISMA_V6_MIGRATION_CN.md`

**引擎 binary（必须保持，否则容器启动崩溃）**
- `binaryTargets` 必须包含 `"linux-arm64-openssl-1.1.x"`（base image = `node:20-bullseye-slim`，OpenSSL 1.1.x）
- 当前正确值：`["native", "debian-openssl-3.0.x", "linux-musl-openssl-3.0.x", "linux-arm64-openssl-1.1.x"]`
- **禁止** 为 `apps/api/node_modules` 单独添加 Docker 卷 → 会导致 Prisma generated client 为空，所有模型类型消失

**Prisma v6 API 变更（用 v5 写法会报 TS 错误）**

| v5 写法 ❌ | v6 正确写法 ✅ |
|-----------|--------------|
| `Prisma.LogDefinition` | 本地定义等价类型（见 `prisma.service.ts`）|
| `$queryRawUnsafe<T>(...)` | `await $queryRawUnsafe(...)` 后再 `as T` |
| `Prisma.PrismaClientKnownRequestError` | `import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'` |
| `catch (e: any)` + `e.message` | `catch (e: unknown)` + `e instanceof Error ? e.message : String(e)` |
| JSON 字段写 `null` | `Prisma.JsonNull`（nullable JSON 字段不接受 JS 原生 null）|

**修改 `schema.prisma` 后的必要操作**
```bash
# 1. 宿主机重新 generate（IDE 和 ESLint 才能看到新类型，否则大量假报错）
node apps/api/node_modules/.bin/prisma generate --schema apps/api/prisma/schema.prisma
# 2. 重启容器（让 prestart:dev 在容器内也重新 generate）
docker compose --env-file deploy/.env.dev up -d backend
```

### CI/CD 文件速查
| 文件 | 触发 | 作用 |
|------|------|------|
| `.github/workflows/ci.yml` | PR / push main | Lint + 类型检查 + 单元测试 + E2E |
| `.github/workflows/deploy-backend.yml` | push main | 后端镜像 → GHCR → VPS |
| `.github/workflows/deploy-admin.yml` | push main | Admin 镜像 → GHCR → VPS |
| `.github/workflows/deploy-master.yml` | 手动触发 | 全量部署 |

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

| Phase | 内容摘要 | 完成日期 |
|-------|---------|---------|
| Phase 0 | standalone 部署 · FOUC 防闪烁 · Dockerfile · Nginx · CI/CD 迁 VPS · SSR 修复 · TS 类型修复 | 2026-03-16 |
| Phase 1 | HTTP-only Cookie 认证 · 服务端路由守卫 · XSS 风险消除 | 2026-03-16 |
| Phase 2 | Dashboard SSR 数据预取 · react-query · HydrationBoundary · 内网直连 | 2026-03-16 |
| Phase 3 | 列表页 Hybrid 模式 · URL searchParams 驱动 filter | 2026-03-16 |
| Phase 5 | 广告/秒杀/系统配置/IM客服/登录日志 — 后端+前端全部补齐，Socket 实时升级 | 2026-03-17 |
| Phase 5.5 | 注册申请功能 — 6层防御(reCAPTCHA/IP限流/域名黑名单/冲突检查) + Resend邮件通知 + 前端申请表单 + 超管审批页 + Sidebar红点 | 2026-03-17 |

> 详细改造记录见 `read/` 目录下各 Phase 文档。

---

## 四、业务功能状态（23 项全部完成）

登录登出 · 后台用户管理 · Banner · 分类 · 产品 · 订单 · 用户+KYC · 财务（充值/提现/审核）· 支付渠道 · 优惠券 · Act Section · 地址 · 拼团 · 操作日志审计 · RBAC 权限角色管理 · 数据分析仪表板 · 通知/推送管理 · 广告管理 · 秒杀活动 · 系统配置 · IM 客服接待台 · 登录日志 · **注册申请（含超管审批 + 邮件通知 + reCAPTCHA）**

---

## 五、Phase 6 — 待规划

> 从下表选定方向后，在 `🎯 当前任务` 区块展开为具体 checkbox 再开始执行。

| 候选项 | 说明 | 优先级 |
|--------|------|--------|
| Lighthouse 性能验收 | 验证 LCP < 500ms（Phase 2 遗留） | 🔴 高 |
| 移动端响应式适配 | Admin 页面在平板/手机上的布局优化 | 🟡 中 |
| 批量操作 | 订单/用户批量状态变更、批量导出 CSV | 🟡 中 |
| 国际化完善 | 所有新增页面补充 `zh` 翻译 key | 🟡 中 |
| E2E 覆盖率提升 | 为 CRUD 新建流程补充完整表单填写 + 提交测试 | 🟢 低 |
| 单元测试补全 | Phase 5 新 view 组件（AdsManagement 等）补 Vitest 测试 | 🟢 低 |

---

## 六、已知风险

| 问题 | 级别 | 状态 |
|------|------|------|
| `auth_token` Cookie 非 HTTP-only，XSS 可窃取 token | 🔴 高 | ✅ Phase 1 已修复 |
| VPS 1GB RAM，Docker 镜像过多可能 OOM | 🔴 高 | 已用 Alpine + standalone 优化，持续监控 |
| Firebase SDK JSON 格式错误（韩文字符在环境变量中） | 🟡 中 | ✅ 已修复 |
| `middleware.ts` 注释过时 | 🟡 中 | ✅ Phase 0 已修复 |
| Prisma 模型加了但没跑 generate → 运行时 `prisma.xxx` 为 undefined | 🔴 高 | ✅ Phase 5.5 已修复：entrypoint.sh 默认跑 migrate deploy；compose.yml dev 也加了 migrate deploy |
| CI 缓存已禁用（GHA 存储不足），每次全量安装慢 | 🟢 低 | 待迁移 Docker Hub 后重启缓存 |
| 引擎 binary 配置缺失导致容器崩溃 | 🔴 高 | ✅ Phase 6 已修复：`schema.prisma` 添加 `"linux-arm64-openssl-1.1.x"`；禁止单独挂载 `apps/api/node_modules` 卷 |
| Prisma v6 breaking changes 导致 TS 错误 | 🔴 高 | ✅ Phase 6 已修复：见二、关键技术约定 Prisma v6 规范 |
| 引擎 binary 配置缺失导致容器崩溃 | 🔴 高 | ✅ Phase 6 已修复：`schema.prisma` 添加 `"linux-arm64-openssl-1.1.x"` |

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
