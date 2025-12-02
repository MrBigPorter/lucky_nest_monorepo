# 项目文档中心

你好！这里是项目的统一文档中心。所有分散的文档都已在这里进行了汇总和简化，方便你快速查阅。

---

## 1. 项目概览：这是什么？

本项目是一个基于 **Monorepo** 架构的电商系统，名为 **`lucky_nest_monorepo`**。

“Monorepo” 意味着所有子项目（前端、后端等）都放在这一个代码仓库里，方便管理。

### 1.1. 项目构成

整个项目由以下几个核心部分组成：

-   **`apps/api`**: **后端服务**
    -   **技术**: 基于 **NestJS** 框架。
    -   **职责**: 提供所有业务逻辑的 API 接口，如用户认证、订单处理、商品管理等。
-   **`apps/web`**: **主前端应用 (面向用户)**
    -   **技术**: 基于 **Next.js** 框架。
    -   **职责**: 用户能直接访问的网站，如商品展示、个人中心等。
-   **`apps/admin`** & **`apps/mini-shop-admin`**: **后台管理界面**
    -   **技术**: 基于 **React**。
    -   **职责**: 供运营和管理员使用的后台系统。
-   **`packages/shared`**: **共享代码库**
    -   **职责**: 存放前后端都需要用到的公共代码，主要是 **TypeScript 类型定义** (如 API 的请求和响应结构)，确保前后端数据格式一致。

### 1.2. 技术栈

-   **项目管理**: Yarn Workspaces + Turborepo
-   **后端**: NestJS, PostgreSQL, Prisma (ORM)
-   **前端**: Next.js, React
-   **通用语言**: TypeScript

---

## 2. 如何运行项目？

你有两种方式来启动项目，推荐使用第一种。

### 方式一：【推荐】使用 Docker 一键启动 (最快)

这种方式会自动为你启动并配置好所有需要的服务（后端API、数据库、数据库管理工具）。

**前提**: 你的电脑上已经安装了 [Docker Desktop](https://www.docker.com/products/docker-desktop/)。

**步骤**:

1.  **准备配置文件**:
    -   在 `apps/api/` 目录下，复制 `.env.docker.prod` 并重命名为 `.env.docker`。

2.  **启动服务**:
    -   在项目的 **根目录** 下，打开终端，运行以下命令：
        ```sh
        docker compose up -d --build
        ```

3.  **验证**:
    -   **后端 API**: 浏览器访问 `http://localhost:4000/docs`，如果能看到 Swagger API 文档页面，说明后端已成功运行。
    -   **数据库管理**: 浏览器访问 `http://localhost:5050`，使用邮箱 `admin@example.com` 和密码 `admin123` 登录 pgAdmin。

4.  **停止服务**:
    ```sh
    docker compose down
    ```

### 方式二：手动启动 (适合单独调试)

如果你想单独启动某个服务（比如只启动后端），可以按以下步骤操作。

**前提**:
-   你的电脑上已经安装了 Node.js (版本 ≥ 18) 和 Yarn。
-   你已经在本地手动安装并运行了 PostgreSQL 数据库。

**步骤**:

1.  **安装项目依赖**:
    -   在项目的 **根目录** 下，运行：
        ```sh
        yarn install
        ```

2.  **启动后端 API**:
    -   **配置数据库连接**: 复制 `apps/api/.env.docker.prod` 为 `.env`，并修改 `DATABASE_URL` 以指向你本地的数据库。
    -   **数据库迁移**: 首次启动时，需要初始化数据库。运行：
        ```sh
        yarn workspace api prisma migrate dev
        ```
    -   **启动服务**:
        ```sh
        yarn workspace api start:dev
        ```

3.  **启动前端 (以 `mini-shop-admin` 为例)**:
    ```sh
    yarn workspace mini-shop-admin dev
    ```

---

## 3. 开发规范

### 3.1. 代码提交流程

为了保持协作的清晰和高效，请遵循以下流程：

1.  **分支管理**:
    -   `main`: 主分支，受保护，代表了可随时发布稳定版本。
    -   `feat/*`: 用于开发新功能 (e.g., `feat/add-coupon-feature`)。
    -   `fix/*`: 用于修复 Bug (e.g., `fix/login-error`)。

2.  **提交信息 (Commit Message)**:
    -   请使用清晰的格式，说明本次提交的 **类型**、**范围** 和 **内容**。
    -   **格式**: `类型(范围): 做了什么`
    -   **示例**:
        -   `feat(api): add user registration endpoint`
        -   `fix(web): correct the display of product prices`
        -   `docs(readme): update project setup instructions`

### 3.2. 数据库修改流程 (Prisma)

所有数据库的表结构都由 `apps/api/prisma/schema.prisma` 文件定义。

**当你修改了 `schema.prisma` 文件后 (例如增删字段、添加新表)，请执行以下命令来更新数据库：**

```sh
# 这条命令会：
# 1. 在 prisma/migrations 目录下生成一个新的 SQL 迁移文件。
# 2. 将这个迁移应用到你的开发数据库。
# 3. 重新生成 Prisma Client 类型，让你的代码能识别到新的表结构。
yarn workspace api prisma migrate dev --name <你的变更描述>
```

-   **`<你的变更描述>`**: 请用简短的英文描述你做了什么，例如 `add_user_coupons`。
-   **重要**: 执行完命令后，记得将新生成的 `prisma/migrations` 文件夹下的所有文件都提交到 Git。

---

## 4. 附录与备忘

### 4.1. 常用命令

所有命令都在项目 **根目录** 下执行。

-   `yarn dev`: **启动所有**应用的开发模式。
-   `yarn build`: **构建所有**应用和包。
-   `yarn dev --filter=web`: **只启动** `web` 应用。
-   `yarn workspace api test`: **只运行** `api` 应用的测试。
-   `yarn lint`: 检查所有代码的格式和规范。
-   `yarn format`: 自动格式化所有代码。

### 4.2. Docker 常用命令

-   `yarn docker:up`: **一键启动**所有服务。
-   `yarn docker:down`: **停止**所有服务。
-   `yarn docker:clean`: **彻底清理** (停止并删除数据)。
-   `yarn docker:logs`: **查看后端日志**。
-   `yarn docker:ps`: **查看服务状态**。
-   `yarn docker:sh`: **进入后端容器** (用于调试)。

### 4.3. Redis 缓存

-   项目中使用了 Redis 作为缓存，由 `CacheModule` 全局管理。
-   在 `api` 服务的 `.env` 文件中，通过 `REDIS_URL` 配置连接地址。
-   如果遇到数据不更新的问题，可以尝试清理 Redis 缓存。

### 4.4. API 文档 (Swagger)

-   当后端服务运行时，可以通过访问 `http://localhost:4000/docs` 查看所有 API 接口的详细文档和进行在线测试。
-   **注意**: 如果 Swagger 页面空白，可能是 `helmet` 的安全策略导致，请检查 `main.ts` 中的相关配置。

---

## 5. 可对接 API 接口总览

这份列表汇总了后端已经实现、可供 `mini-shop-admin` 对接的接口。

#### **认证模块 (`/auth`)**

-   `POST /auth/login/otp`: **OTP 登录**
    -   **作用**: 使用手机号和验证码进行登录。
    -   **对接页面**: `Login.tsx`
-   `POST /auth/refresh`: **刷新 Token**
    -   **作用**: 维持登录状态。
    -   **对接页面**: 在 API 请求的全局封装中处理。
-   `GET /auth/profile`: **获取当前用户信息**
    -   **作用**: 获取当前已登录管理员的详细信息。
    -   **对接页面**: `Layout.tsx` (用于显示右上角的用户信息)。

#### **用户模块 (`/users`)**

-   `GET /users`: **获取用户列表**
    -   **对接页面**: `UserManagement.tsx`
-   `POST /users`: **创建用户**
    -   **对接页面**: `UserManagement.tsx` (在“新增用户”的弹窗表单中)。

#### **订单模块 (`/orders`)**

-   `POST /orders/list`: **获取订单列表**
    -   **作用**: 分页、筛选获取订单列表。
    -   **对接页面**: `OrderManagement.tsx`
-   `POST /orders/detail`: **获取订单详情**
    -   **作用**: 获取单个订单的详细信息。
    -   **对接页面**: `OrderManagement.tsx` (点击某个订单后)。

#### **产品 (抽奖) 模块 (`/treasure`)**

-   `GET /treasure`: **获取产品列表**
    -   **对接页面**: `ProductManagement.tsx`
-   `GET /treasure/:id`: **获取产品详情**
    -   **对接页面**: `ProductManagement.tsx` (编辑产品时)。

#### **优惠券模块 (`/coupons`)**

-   **后台管理所需接口 (待开发)**:
    -   `GET /admin/coupons`: 获取优惠券模板列表。
    -   `POST /admin/coupons`: 创建新的优惠券模板。
    -   `PUT /admin/coupons/:id`: 更新指定的优惠券模板。
    -   `DELETE /admin/coupons/:id`: 删除指定的优惠券模板。
-   **用户端接口 (已实现)**:
    -   `POST /coupons/claim`: 用户领取优惠券。
    -   `POST /coupons/redeem`: 兑换码兑换。

#### **其他模块**

-   `GET /categories`: **获取产品分类列表** (`CategoryManagement.tsx`)
-   `GET /groups/list`: **获取组团列表** (`GroupManagement.tsx`)
-   `GET /groups/:groupId/members`: **获取组团成员** (`GroupManagement.tsx`)
-   `POST /wallet/balance`: **查询用户钱包余额** (`UserManagement.tsx` 的用户详情中)
-   `GET /banners`: **获取 Banner 列表** (`ContentCMS.tsx`)
-   `GET /ads`: **获取广告列表** (`ContentCMS.tsx`)
-   `GET /home/sections`: **获取首页专区** (`ContentCMS.tsx`)
-   `GET /health`, `GET /dbcheck`: **健康检查** (用于系统监控，前端一般不用)

---
*文档整理完毕。*
