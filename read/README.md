# 项目文档中心

你好！这里是项目的统一文档中心。所有分散的文档都已在这里进行了汇总和简化，方便你快速查阅。

---

## 1. 快速开始

本文档的目标是让你在 10 分钟内将项目跑起来，并了解如何进行日常开发。

### 1.1. 【推荐】使用 Docker 一键启动

这种方式会自动为你启动所有服务（后端API、数据库等）。

**前提**: 你的电脑上已经安装了 [Docker Desktop](https://www.docker.com/products/docker-desktop/)。

**步骤**:

1.  **准备配置文件**:
    - 在 `apps/api/` 目录下，复制 `.env.docker.prod` 并重命名为 `.env.docker`。

2.  **启动服务**:
    - 在项目的 **根目录** 下，打开终端，运行以下命令：
      ```sh
      yarn docker:up
      ```

3.  **验证**:
    - **后端 API**: 浏览器访问 `http://localhost:4000/docs`，如果能看到 Swagger API 文档页面，说明后端已成功运行。
    - **数据库管理**: 浏览器访问 `http://localhost:5050`，使用邮箱 `admin@example.com` 和密码 `admin123` 登录 pgAdmin。

### 1.2. 常用命令

所有命令都在项目 **根目录** 下执行。

- `yarn dev`: **启动所有**应用的开发模式。
- `yarn build`: **构建所有**应用和包。
- `yarn dev --filter=mini-shop-admin`: **只启动** `mini-shop-admin` 前端。

**Docker 相关:**

- `yarn docker:up`: 一键启动所有服务。
- `yarn docker:down`: 停止所有服务。
- `yarn docker:logs`: 查看后端日志。
- `yarn docker:ps`: 查看服务状态。

---

## 2. 核心文档链接

- **[项目架构与核心上下文 (ARCHITECTURE.md)](./ARCHITECTURE.md)**
  - **必读！** 这份文档是项目的“地图”，它描述了整个项目的技术选型、分层结构、各个应用（`api`, `admin`, `web` 等）的职责以及它们之间的关系。在进行任何开发前，请先阅读此文档。

- **[项目优化待办事项 (TODO.md)](./TODO.md)**
  - 这份文档记录了对项目进行结构优化和功能增强的详细步骤。你可以按照这个清单来了解项目的后续开发计划，或者参与其中。

---

## 3. 开发规范

### 3.1. 代码提交流程

1.  **分支管理**:
    - `main`: 主分支，受保护。
    - `feat/*`: 用于开发新功能 (e.g., `feat/add-coupon-feature`)。
    - `fix/*`: 用于修复 Bug (e.g., `fix/login-error`)。

2.  **提交信息**:
    - **格式**: `类型(范围): 做了什么`
    - **示例**: `feat(api): add user registration endpoint`

### 3.2. 数据库修改流程 (Prisma)

所有数据库的表结构都由 `apps/api/prisma/schema.prisma` 文件定义。

当你修改了 `schema.prisma` 文件后，请执行以下命令来更新数据库：

```sh
yarn workspace api prisma migrate dev --name <你的变更描述>
```

- **`<你的变更描述>`**: 请用简短的英文描述你做了什么，例如 `add_user_coupons`。
- **重要**: 执行完命令后，记得将新生成的 `prisma/migrations` 文件夹下的所有文件都提交到 Git。
