# Lucky Nest Monorepo — Copilot 工作指令

> **重要**: 每次对话先看 `## 🎯 当前任务`，按 Phase 推进，不做计划外的事。  
> 完成一个 checkbox 后立即将 `[ ]` 改为 `[x]` 并更新本文件。

---

## 🎯 当前任务（每次对话从这里开始）

**阶段**: Phase 1 — 认证系统迁移  
**上次停留**: Phase 0 全部完成，Phase 1 尚未开始  
**立即执行顺序**:
1. 先收尾 Phase 0 遗留 → `PaymentChannelModal.tsx` 移除 `.default()`，更新 `middleware.ts` 注释（5 分钟）
2. 再开始 Phase 1 → 后端新增 `POST /v1/admin/auth/set-cookie`

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

## 三、SSR 升级路线图

### ✅ Phase 0 — 基础设施准备（完成 2026-03-16）
> 详细记录见 `read/REFACTOR_PHASE0_CN.md`

`standalone` 部署 · FOUC 防闪烁 · Dockerfile 重写 · Nginx 反向代理 · CI/CD 迁到 VPS · `dynamic(ssr:false)` 移除 · `FormRichTextField` SSR 修复 · TS 类型修复（hookform/resolvers v5）— **全部完成**

**Phase 0 遗留（未阻断主线，尽快收尾）**:
- [ ] `PaymentChannelModal.tsx`: 移除 schema 中 `sortOrder/isCustom/feeFixed/feeRate` 的 `.default()`
- [ ] `middleware.ts`: 更新顶部注释（现写"生产不生效"，standalone 后已生效，需更正）

---

### 🔄 Phase 1 — 认证系统迁移（当前阶段）
> 目标: token 迁移到 HTTP-only Cookie，消除 XSS 风险 + 服务端认证，彻底消除页面加载闪烁  
> 分析文档: `read/SSR_UPGRADE_ANALYSIS_CN.md`

**当前问题**: `useAuthStore.login()` 用 `document.cookie` 设置普通 Cookie，JS 可读（XSS 可窃取）

- [ ] **后端** 新增 `POST /v1/admin/auth/set-cookie`
  - 接收 `{ token: string }` → 验证有效 → `res.cookie('auth_token', token, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 86400 })`
- [ ] **前端** `useAuthStore.login()` 改为双写
  - 保留 `localStorage.setItem('auth_token', token)`（向下兼容）
  - 新增: 调用 `POST /v1/admin/auth/set-cookie` 让后端设置 HTTP-only Cookie
  - 删除: `document.cookie = ...` 这行
- [ ] **前端** `useAuthStore.logout()` 调用后端接口清除 HTTP-only Cookie
- [ ] **前端** `DashboardLayout` → 升级为 Server Component
  - 移除 `'use client'`
  - 服务端用 `cookies()` from `next/headers` 读 token 验证
  - 未登录直接 `redirect('/login')`（无客户端闪烁）
- [ ] 验证: 刷新 `/users` 无 loading spinner，直接看到内容

---

### ⬜ Phase 2 — Dashboard SSR 数据预取（待开发）
> 目标: LCP 从 ~1.3s → ~200ms | 文档: `read/SSR_UPGRADE_ANALYSIS_CN.md`

- [ ] `app/(dashboard)/page.tsx` → Server Component + `<Suspense>` streaming
- [ ] `DashboardStats` → Server Component（服务端 fetch 统计数据）
- [ ] `DashboardCharts` → Client Component（recharts 依赖浏览器 API）
- [ ] `@tanstack/react-query` 配置 `HydrationBoundary`（Server → Client 数据传递）
- [ ] Lighthouse 验证 LCP < 500ms

---

### ⬜ Phase 3 — 列表页 Hybrid 模式（规划中）
> 目标: URL searchParams 驱动服务端 filter，支持分享带条件链接

- [ ] 列表页 `page.tsx` → Server Component，接收 `searchParams` prop
- [ ] View 组件重命名 `XxxClient.tsx`，接收 `initialData` prop
- [ ] URL searchParams 驱动 filter（替代客户端 `useState` filter）
- [ ] 受影响页面: `/users` `/products` `/orders` `/banners` `/kyc` `/finance` `/groups`

---

## 四、业务功能状态

**已完成（13 项）**: 登录登出 · 后台用户管理 · Banner · 分类 · 产品 · 订单 · 用户+KYC · 财务（充值/提现/审核）· 支付渠道 · 优惠券 · Act Section · 地址 · 拼团

**待完成**:
- [ ] 操作日志审计页面（后端 `AdminOperationLog` 模型已有，缺前端页面）
- [ ] RBAC 权限角色管理界面（后端 `RolesGuard` 已有，缺前端页面）
- [ ] 数据分析仪表板（接入真实统计接口，替换当前 mock 图表）
- [ ] 通知/推送管理（Firebase Admin SDK 已集成，缺管理界面）

---

## 五、已知风险

| 问题 | 级别 | 状态 |
|------|------|------|
| `auth_token` Cookie 非 HTTP-only，XSS 可窃取 token | 🔴 高 | Phase 1 修复 |
| VPS 1GB RAM，Docker 镜像过多可能 OOM | 🔴 高 | 已用 Alpine + standalone 优化，持续监控 |
| Firebase SDK JSON 格式错误（韩文字符在环境变量中） | 🟡 中 | 已发现，需检查 `FIREBASE_SERVICE_ACCOUNT` 变量 |
| `middleware.ts` 注释过时（写着"生产不生效"） | 🟡 中 | Phase 0 遗留，Phase 1 顺手修 |
| CI 缓存已禁用（GHA 存储不足），每次全量安装慢 | 🟢 低 | 待迁移 Docker Hub 后重启缓存 |

---

## 六、工作原则（每次对话必须遵守）

1. **先看 `🎯 当前任务` → 确认 Phase → 再动手**，不做 Phase 之外的事
2. **每完成一个 checkbox 立即更新本文件**（`[ ]` → `[x]`），保持进度同步
3. 修改 `packages/ui` → 必须 `node packages/ui/scripts/build.js`
4. 修改 `packages/shared` → 必须 `node packages/shared/scripts/build.js`
5. Zod schema **禁止** `.default()` 和 `.transform()`（见技术约定）
6. 生产部署前检查 `deploy/.env.prod` 包含所有必需变量
7. 数据库变更必须通过 `prisma migrate dev` 生成迁移文件
8. 新增 API 接口必须有 TS 类型定义（`src/api/types.ts` 或模块 type 文件）
