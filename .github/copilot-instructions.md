# Lucky Nest Monorepo — Copilot 工作指令

> **重要**: 每次对话先看 `## 🎯 当前任务`，按 Phase 推进，不做计划外的事。

---

## 🎯 当前任务（每次对话从这里开始）

**阶段**: Phase 6 — 待规划  
**上次停留**: Phase 5 全部完成（2026-03-17）  
**立即执行**: 从下方 Phase 6 候选表中选定方向，展开为 checkbox 后开始

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
| CI 缓存已禁用（GHA 存储不足），每次全量安装慢 | 🟢 低 | 待迁移 Docker Hub 后重启缓存 |

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
