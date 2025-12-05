# 项目优化待办事项 (TODO)

本文档记录了对项目进行结构优化和功能增强的详细步骤，您可以按照这个清单逐一完成。

---

## 任务一：【安全核心】分离后台与客户端用户体系

**目标**: 建立独立的后台管理员账户体系，从物理和逻辑上彻底分离普通用户和管理员，消除安全隐患。

### 数据库 (`schema.prisma`)

-   [x] **在 `apps/api/prisma/schema.prisma` 文件中，添加 `AdminUser` 和 `AdminOperationLog` 这两个新的数据模型。**

### 后端 (`apps/api`)

-   [x] **创建后台专用的认证模块 (`apps/api/src/admin/auth`)。**
-   [x] **实现后台登录/登出接口 (`POST /auth/admin/login`, `POST /auth/admin/logout`)。**
-   [x] **创建后台专用的授权守卫 (`AdminJwtAuthGuard`) 和角色守卫 (`RolesGuard`)。**
-   [x] **实现完整的后台用户管理接口 (增、删、改、查)。**

### 前端 (`mini-shop-admin`)

-   [x] **对接后台登录接口 `POST /auth/admin/login`。**
-   [x] **对接后台用户列表接口 `GET /admin/user/list`。**
-   [ ] **对接创建用户接口**: 在 `CreateAdminUserModal` 中，使用 `useRequest` 对接 `POST /admin/user/create` 接口。
-   [ ] **对接更新用户接口**: 在 `EditAdminUserModal` 中，使用 `useRequest` 对接 `PATCH /admin/user/:id` 接口。
-   [ ] **对接删除用户接口**: 在 `AdminUserManagement` 的删除确认弹窗中，使用 `useRequest` 对接 `DELETE /admin/user/:id` 接口。

---

## 任务二：【代码质量】优化 API 请求层 (前端)

**目标**: 将所有 API 请求从组件中抽离，使用 `TanStack Query` (React Query) 进行统一管理，自动处理缓存、加载和错误状态。

-   [ ] **安装依赖**: 在 `mini-shop-admin` 目录下，运行 `yarn add @tanstack/react-query`。
-   [ ] **引入 `QueryClientProvider`**: 在 `App.tsx` 中，使用 `<QueryClientProvider>` 包裹整个应用。
-   [ ] **重构页面数据获取逻辑**: 在 `AdminUserManagement.tsx` 等页面中，使用 `useQuery` 替代 `useAntdTable` 或 `useEffect` 来获取数据。
-   [ ] **重构写操作逻辑**: 使用 `useMutation` 来处理创建、更新和删除等操作，并利用其 `onSuccess` 回调来智能刷新列表数据。

---

## 任务三：【结构优化】整理组件文件夹 (前端)

**目标**: 使组件库的结构更清晰，提高复用性和可发现性。

-   [x] **创建了 `src/components/ui/` 目录。**
-   [x] **创建了 `src/components/layout/` 目录。**
-   [ ] **将巨大的 `UIComponents.tsx` 文件拆分**，每个组件一个文件，并放入 `src/components/ui/` 目录下。
-   [ ] **创建一个 `src/components/ui/index.ts` 文件**，统一导出所有 UI 组件，方便外部调用。

---

## 任务四：【功能完善】完善产品管理功能

**目标**: 对接产品管理的“增删改查”接口，并提供完整的表单校验和交互体验。

### 后端 (API)

-   [ ] **创建 `ProductController`**，并实现 `GET`, `POST`, `PUT`, `DELETE`, `PATCH` 等接口。

### 前端 (`ProductManagement.tsx`)

-   [ ] **对接列表接口**: 使用 `useAntdTable` 或 `useQuery` 对接产品列表接口。
-   [ ] **创建/编辑表单**: 将弹窗抽离成 `ProductFormModal.tsx`，并使用 `zod` 和 `react-hook-form` 进行表单管理。
-   [ ] **对接操作接口**: 对接创建、更新、删除和状态变更接口。

---

## 任务五：【新页面】实现分类管理页面

**目标**: 创建一个新页面，用于管理所有产品分类。

### 后端 (API)

-   [ ] **创建 `CategoryController`**，并实现增、删、改、查接口。

### 前端 (`CategoryManagement.tsx`)

-   [ ] **对接列表接口**，展示所有分类。
-   [ ] **实现创建/编辑弹窗**，并对接相应接口。

---

## 任务六：【新页面】实现活动专区管理

**目标**: 创建一个新页面，用于管理首页等位置的活动专区。

### 后端 (API)

-   [ ] **创建 `ActSectionController`**，并实现对专区的增、删、改、查，以及专区内商品的管理接口。

### 前端 (一个新页面)

-   [ ] **实现专区管理**和**专区内商品的管理**（添加、移除、排序）的前端交互。
-   [ ] **对接所有相关接口**。
