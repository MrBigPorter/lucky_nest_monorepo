# 项目优化待办事项 (TODO)

本文档记录了对项目进行结构优化和功能增强的详细步骤，您可以按照这个清单逐一完成。

---

## 任务一：【安全核心】分离后台与客户端用户体系

**目标**: 建立独立的后台管理员账户体系，从物理和逻辑上彻底分离普通用户和管理员，消除安全隐患。

### 步骤 1: 更新数据库 (`schema.prisma`)

-   [ ] **在 `apps/api/prisma/schema.prisma` 文件中，添加 `AdminUser` 和 `AdminOperationLog` 这两个新的数据模型。**
-   [ ] **执行数据库迁移命令：** `yarn workspace api prisma migrate dev --name add_admin_users`

### 步骤 2: 创建后台专用的认证模块

-   [ ] **创建 `apps/api/src/admin-auth` 目录及相关文件。**
-   [ ] **实现后台登录接口 `POST /admin/auth/login`**，使其查询 `admin_users` 表并签发后台专用的 JWT。
-   [ ] **在根模块 (`app.module.ts`) 中注册新的 `AdminAuthModule`。**

### 步骤 3: 创建后台专用的授权守卫

-   [ ] **创建 `AdminJwtAuthGuard`**，使用独立的密钥来验证后台 Token。
-   [ ] **(可选，但推荐) 创建基于角色的访问控制 (RBAC)**，包括 `@Roles()` 装饰器和 `RolesGuard` 守卫。

### 步骤 4: 更新前端登录逻辑

-   [ ] **修改 `mini-shop-admin` 的登录页面**，使其调用新的后台登录接口 `POST /admin/auth/login`。
-   [ ] **更新 `mini-shop-admin` 的 `useAuthStore`**，确保 `login` 和 `logout` 方法处理的是后台专用的 Token。

---

## 任务二：【代码质量】优化 API 请求层

**目标**: 将所有 API 请求从组件中抽离，使用 `TanStack Query` (React Query) 进行统一管理，自动处理缓存、加载和错误状态。

### 步骤 1: 安装依赖

-   [ ] 在 `mini-shop-admin` 目录下，运行 `yarn add @tanstack/react-query`。

### 步骤 2: 创建 API Client

-   [ ] **创建 `src/lib/api.ts` 文件**，使用 `axios` 或 `fetch` 封装一个 API 请求客户端，并配置好请求拦截器（用于自动附加 `Authorization` 头）。
-   [ ] **创建 `src/services` 目录**，按模块（如 `userService.ts`, `orderService.ts`）封装所有 API 请求函数。

### 步骤 3: 引入 QueryClientProvider

-   [ ] **在 `App.tsx` 中**，使用 `<QueryClientProvider>` 包裹整个应用。

### 步骤 4: 重构页面数据获取逻辑

-   [ ] **在各个页面组件中 (如 `UserManagement.tsx`)**，使用 `useQuery` 替代原有的 `useEffect` + `useState` 来获取数据。
-   [ ] **使用 `useMutation`** 来处理创建、更新和删除等操作，并利用其 `onSuccess` 回调来自动刷新列表数据。

---

## 任务三：【结构优化】整理组件文件夹

**目标**: 使组件库的结构更清晰，提高复用性和可发现性。

### 步骤 1: 细分 `components` 目录

-   [ ] **在 `src/components` 目录下创建子文件夹**：
    -   `ui/`: 存放最基础、无业务逻辑的通用组件（如 `Button`, `Input`, `Modal`）。我们现有的 `UIComponents.tsx` 将被拆分并放入此目录。
    -   `layout/`: 存放布局相关的组件（如 `Layout.tsx`, `Sidebar.tsx`, `Header.tsx`）。
    -   `shared/`: 存放可以在不同页面之间复用的、包含一定业务逻辑的组件（如 `UserPicker`, `ProductSelector`）。

### 步骤 2: 拆分 `UIComponents.tsx`

-   [ ] **将巨大的 `UIComponents.tsx` 文件拆分**，每个组件一个文件，例如：
    -   `src/components/ui/Button.tsx`
    -   `src/components/ui/Card.tsx`
    -   `src/components/ui/Modal.tsx`
    -   ...
-   [ ] **创建一个 `src/components/ui/index.ts` 文件**，统一导出所有 UI 组件，方便外部调用。

---

## 任务四：【功能完善】完善产品管理功能

**目标**: 对接产品管理的“增删改查”接口，并提供完整的表单校验和交互体验。

### 后端 (API)

-   [ ] **创建 `ProductController`**，并实现以下接口：
    -   `GET /admin/products`: 获取产品列表（支持分页、按名称/分类搜索）。
    -   `GET /admin/products/:id`: 获取单个产品详情。
    -   `POST /admin/products`: 创建新产品。
    -   `PUT /admin/products/:id`: 更新产品信息。
    -   `DELETE /admin/products/:id`: 删除产品。
    -   `PATCH /admin/products/:id/status`: 单独更新产品状态（上架/下架）。

### 前端 (`ProductManagement.tsx`)

-   [ ] **对接列表接口**: 使用 `useAntdTable` 对接 `GET /admin/products` 接口，实现分页和搜索功能。
-   [ ] **创建/编辑表单**:
    -   将“新增/编辑产品”的弹窗抽离成独立的 `ProductFormModal.tsx` 组件。
    -   使用 `zod` 为产品表单创建详细的校验 schema，包括对价格、库存、抽奖模式等的校验。
    -   使用 `react-hook-form` 管理表单状态。
    -   在表单中，提供**分类选择器**（多选），用于关联 `ProductCategory`。
-   [ ] **对接操作接口**:
    -   在 `ProductFormModal` 中，使用 `useRequest` 分别对接 `POST` (创建) 和 `PUT` (更新) 接口。
    -   在列表的操作列中，对接 `DELETE` (删除) 和 `PATCH` (状态更新) 接口，并添加二次确认弹窗。
-   [ ] **优化交互**: 实现产品列表的拖拽排序功能，并在拖拽结束后调用后端接口保存新的顺序。

---

## 任务五：【新页面】实现分类管理页面

**目标**: 创建一个新页面，用于管理所有产品分类。

### 后端 (API)

-   [ ] **创建 `CategoryController`**，并实现以下接口：
    -   `GET /admin/categories`: 获取所有分类的列表。
    -   `POST /admin/categories`: 创建新分类。
    -   `PUT /admin/categories/:id`: 更新分类名称。
    -   `DELETE /admin/categories/:id`: 删除分类（需要校验该分类下是否还有产品）。

### 前端 (`CategoryManagement.tsx`)

-   [ ] **对接列表接口**: 使用 `useRequest` 或 `useAntdTable` 对接 `GET /admin/categories` 接口，以卡片或列表形式展示所有分类。
-   [ ] **创建/编辑表单**:
    -   实现一个弹窗，用于新增或编辑分类名称。
    -   使用 `zod` 和 `react-hook-form` 进行表单校验。
-   [ ] **对接操作接口**: 对接创建、更新和删除接口，并提供相应的用户反馈（Toast 通知）。

---

## 任务六：【新页面】实现活动专区管理

**目标**: 创建一个新页面，用于管理首页等位置的活动专区，并能向其中添加或移除商品。

### 后端 (API)

-   [ ] **创建 `ActSectionController`**，并实现以下接口：
    -   `GET /admin/sections`: 获取所有活动专区的列表。
    -   `POST /admin/sections`: 创建新的活动专区。
    -   `PUT /admin/sections/:id`: 更新专区信息（如标题）。
    -   `DELETE /admin/sections/:id`: 删除专区。
    -   `POST /admin/sections/:id/items`: 向专区中批量添加商品。
    -   `PUT /admin/sections/:id/items/order`: 更新专区内商品的排序。

### 前端 (一个新页面，例如 `ActivityZoneManagement.tsx`)

-   [ ] **主页面布局**:
    -   左侧显示活动专区列表。
    -   右侧显示当前选中专区内的商品列表。
-   [ ] **专区管理**: 实现对活动专区的增、删、改操作。
-   [ ] **商品管理**:
    -   实现一个“添加商品”的弹窗，其中包含一个带搜索功能的产品选择器。
    -   在右侧的商品列表中，实现商品的**拖拽排序**功能。
    -   实现从专区中**移除商品**的功能。
-   [ ] **对接所有相关接口**，并提供完整的用户交互和反馈。
