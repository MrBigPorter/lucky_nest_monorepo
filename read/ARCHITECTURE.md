# 项目架构与核心上下文

本文档旨在提供 `lucky_nest_monorepo` 项目的整体架构、技术选型和核心决策的清晰概览，作为团队成员快速理解项目和进行后续开发的基础。

---

## 1. 项目核心架构

- **模式**: Monorepo，使用 `Yarn Workspaces` + `Turborepo` 进行管理。
- **主要应用 (`apps/`)**:
  - `api`: **后端服务**，基于 **NestJS**。这是所有业务逻辑的核心。
  - `admin-next`: **后台管理前端**，基于 **Next.js**。这是当前工作的焦点。
  - `liveness-web`: **活体检测前端**，基于 **Vite + React**。
- **共享库 (`packages/`)**:
  - `shared`: 用于存放前后端共享的 **TypeScript 类型**和纯函数，是保证数据契约一致性的关键。

## 2. 后端 (`apps/api`) 上下文

- **框架**: **NestJS**，采用模块化结构（如 `AuthModule`, `UserModule`, `OrderModule`）。
- **数据库**: **PostgreSQL**，使用 **Prisma** 作为 ORM。`apps/api/prisma/schema.prisma` 是数据库结构的唯一真实来源。
- **认证**:
  - **客户端认证**: 已存在一套面向普通用户的认证体系，基于手机 OTP 登录，使用 `JWT_SECRET` 签发 Token。
  - **后台认证**: 正在为后台管理员建立一套**独立的**认证体系，基于 `AdminUser` 表和独立的 `ADMIN_JWT_SECRET` 密钥。
- **配置**: 使用 `@nestjs/config` 从 `.env` 文件加载环境变量。
- **API 文档**: 使用 `@nestjs/swagger` 在 `/docs` 路径自动生成 API 文档。

## 3. 后台管理前端 (`apps/admin-next`) 上下文

- **框架**: **Next.js 15 + React 19**（App Router）。
- **目录结构**: 以 `src/app` 路由目录为核心，配合 `src/views`、`src/components` 组织页面与组件。
- **路由**: 使用 Next.js 文件路由；受保护页面通过 `middleware.ts` 和登录态策略协同控制。
- **状态管理**:
  - **状态方案**: 使用 **Zustand** 管理认证、主题、语言和 UI 全局状态。
  - **Store 结构**: 状态被拆分到 `useAuthStore`, `useAppStore`, `useToastStore` 中。
- **UI 与组件**:
  - **样式**: 使用 **Tailwind CSS v4**。
  - **组件库**: 基础 UI 组件位于 `src/components/ui/`，布局与业务视图位于 `src/components` / `src/views`。
- **数据请求**:
  - **已建立**: `src/api/http.ts` 封装 `axios` 作为统一请求客户端，并包含 Token 与错误处理拦截器。
  - **已定义**: 在 `src/api/index.ts` 按模块组织 API 方法。
  - **补充**: Server Component 场景通过 `src/lib/serverFetch.ts` 从 Cookie 读取令牌并发起服务端请求。

## 4. 当前的核心任务

- **目标**: 彻底分离后台管理员和客户端用户的认证与授权体系。
- **进度**:
  - 已在 `read/TODO.md` 中明确了计划。
  - 已确认了 `AdminUser` 表的设计。
  - **正在进行**: 在后端 `api` 项目中，为管理员创建一套独立的认证策略 (`AdminJwtStrategy`) 和授权守卫 (`AdminJwtAuthGuard`)。
