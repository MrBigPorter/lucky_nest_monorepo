# 项目优化待办事项 (TODO)

本文档记录了对项目进行结构优化和功能增强的详细步骤，您可以按照这个清单逐一完成。

---

## 任务一：【安全核心】分离后台与客户端用户体系

**目标**: 建立独立的后台管理员账户体系，从物理和逻辑上彻底分离普通用户和管理员，消除安全隐患。

### 步骤 1: 更新数据库 (`schema.prisma`)

- [ ] **在 `apps/api/prisma/schema.prisma` 文件中，添加 `AdminUser` 和 `AdminOperationLog` 这两个新的数据模型。**

  ```prisma
  // ======== Admin Users (for backend system) ========
  model AdminUser {
    id        String   @id @default(cuid()) @db.VarChar(32)
    createdAt DateTime @default(now()) @map("created_at")
    updatedAt DateTime @updatedAt @map("updated_at")

    username String @unique @db.VarChar(50)
    password String @db.VarChar(255)
    realName String? @map("real_name") @db.VarChar(100)
    role     String  @default("viewer") @db.VarChar(50)
    status   Int     @default(1) @db.SmallInt
    lastLoginAt DateTime? @map("last_login_at")
    lastLoginIp String?   @map("last_login_ip") @db.VarChar(50)
    operationLogs AdminOperationLog[]

    @@map("admin_users")
  }

  // ======== Admin Operation Logs ========
  model AdminOperationLog {
    id        String   @id @default(cuid()) @db.VarChar(32)
    createdAt DateTime @default(now()) @map("created_at")

    adminId   String @map("admin_id") @db.VarChar(32)
    adminName String @map("admin_name") @db.VarChar(100)
    module    String @map("operation_module") @db.VarChar(50)
    action    String @map("operation_action") @db.VarChar(100)
    details   String? @db.Text
    requestIp String? @map("request_ip") @db.VarChar(50)
    admin     AdminUser @relation(fields: [adminId], references: [id], onDelete: Cascade)

    @@index([adminId])
    @@index([module, action])
    @@map("admin_operation_logs")
  }
  ```

- [ ] **执行数据库迁移命令。**
      在项目根目录的终端中运行：
  ```sh
  yarn workspace api prisma migrate dev --name add_admin_users
  ```

### 步骤 2: 创建后台专用的认证模块

- [ ] **创建 `apps/api/src/admin-auth` 目录及相关文件。**
- [ ] **实现后台登录接口 `POST /admin/auth/login`**，使其查询 `admin_users` 表并签发后台专用的 JWT。
- [ ] **在根模块 (`app.module.ts`) 中注册新的 `AdminAuthModule`。**

### 步骤 3: 创建后台专用的授权守卫

- [ ] **创建 `AdminJwtAuthGuard`**，使用独立的密钥来验证后台 Token。
- [ ] **(可选，但推荐) 创建基于角色的访问控制 (RBAC)**，包括 `@Roles()` 装饰器和 `RolesGuard` 守卫。

### 步骤 4: 更新前端登录逻辑

- [ ] **修改 `mini-shop-admin` 的登录页面**，使其调用新的后台登录接口 `POST /admin/auth/login`。
- [ ] **更新 `mini-shop-admin` 的 `useAuthStore`**，确保 `login` 和 `logout` 方法处理的是后台专用的 Token。

---

## 任务二：【代码质量】优化 API 请求层

**目标**: 将所有 API 请求从组件中抽离，使用 `TanStack Query` (React Query) 进行统一管理，自动处理缓存、加载和错误状态。

### 步骤 1: 安装依赖

- [ ] 在 `mini-shop-admin` 目录下，运行 `yarn add @tanstack/react-query`。

### 步骤 2: 创建 API Client

- [ ] **创建 `src/api/http.ts` 文件**，使用 `axios` 或 `fetch` 封装一个 API 请求客户端，并配置好请求拦截器（用于自动附加 `Authorization` 头）。
- [ ] **创建 `src/services` 目录**，按模块（如 `userService.ts`, `orderService.ts`）封装所有 API 请求函数。

### 步骤 3: 引入 QueryClientProvider

- [ ] **在 `App.tsx` 中**，使用 `<QueryClientProvider>` 包裹整个应用。

### 步骤 4: 重构页面数据获取逻辑

- [ ] **在各个页面组件中 (如 `UserManagement.tsx`)**，使用 `useQuery` 替代原有的 `useEffect` + `useState` 来获取数据。
- [ ] **使用 `useMutation`** 来处理创建、更新和删除等操作，并利用其 `onSuccess` 回调来自动刷新列表数据。

---

## 任务三：【结构优化】整理组件文件夹

**目标**: 使组件库的结构更清晰，提高复用性和可发现性。

### 步骤 1: 细分 `components` 目录

- [ ] **在 `src/components` 目录下创建子文件夹**：
  - `ui/`: 存放最基础、无业务逻辑的通用组件（如 `Button`, `Input`, `Modal`）。我们现有的 `UIComponents.tsx` 将被拆分并放入此目录。
  - `layout/`: 存放布局相关的组件（如 `Layout.tsx`, `Sidebar.tsx`, `Header.tsx`）。
  - `shared/`: 存放可以在不同页面之间复用的、包含一定业务逻辑的组件（如 `UserPicker`, `ProductSelector`）。

### 步骤 2: 拆分 `UIComponents.tsx`

- [ ] **将巨大的 `UIComponents.tsx` 文件拆分**，每个组件一个文件，例如：
  - `src/components/ui/Button.tsx`
  - `src/components/ui/Card.tsx`
  - `src/components/ui/Modal.tsx`
  - ...
- [ ] **创建一个 `src/components/ui/index.ts` 文件**，统一导出所有 UI 组件，方便外部调用。

---

_文档创建完毕。您可以根据此清单开始您的项目优化工作。_
