# 项目开发路线图 (Roadmap & TODO)

本文档是项目的整体开发路线图，旨在将所有设计和需求转化为可执行的任务清单。

---

## 第一阶段：核心框架与基础建设 (进行中)

**目标**: 搭建一个安全、稳定、可扩展的开发框架，为后续大规模功能开发奠定基础。

### 1.1. 后台用户体系分离 (安全基石)

- [x] **数据库**: 在 `schema.prisma` 中已添加 `AdminUser` 和 `AdminOperationLog` 模型。
- [x] **后端 API**:
  - [x] 创建了独立的后台登录/登出接口 (`/auth/admin/login`)。
  - [x] 创建了完整的后台用户管理接口 (增、删、改、查)。
  - [x] 创建并应用了后台专用的 `AdminJwtAuthGuard`，确保所有 `/admin/*` 下的接口都受到独立密钥的保护。
  - [x] 实现并应用了 `RolesGuard`，为接口提供基于角色的访问控制。
- [ ] **前端对接 (待办)**:
  - [x] 已对接后台登录接口 `POST /auth/admin/login`。
  - [x] 已对接后台用户列表接口 `GET /admin/user/list`。
  - [ ] 对接 `createUser`, `updateUser`, `deleteUser` 接口，完成完整的“增删改查”闭环。

### 1.2. 前端架构优化

- [x] **目录结构**: 已建立标准的 `src` 目录结构。
- [x] **状态管理**: 已引入 `Zustand` 并按领域拆分 `store`。
- [ ] **组件库 (待办)**:
  - [ ] 将巨大的 `UIComponents.tsx` 文件彻底拆分成独立的原子组件，存放在 `src/components/ui/` 目录下。
  - [ ] 创建 `src/components/ui/index.ts` 作为统一出口。
- [ ] **API 请求层 (待办)**:
  - [ ] 引入 `@tanstack/react-query`，并配置 `QueryClientProvider`。
  - [ ] 使用 `useQuery` 和 `useMutation` 重构现有页面的数据获取和操作逻辑。

---

## 第二阶段：核心业务管理功能 (待开发)

**目标**: 实现后台对核心业务（产品、分类、订单、优惠券）的完整管理能力。

### 2.1. 产品管理 (`ProductManagement.tsx`)

- [ ] **后端**: 创建 `ProductController`，实现对 `Treasure` 模型的完整“增删改查”及状态管理接口。
- [ ] **前端**:
  - [ ] 对接真实的 `getProducts` 接口，替换所有模拟数据。
  - [ ] 重构“新增/编辑产品”弹窗，使用 `react-hook-form` 和 `zod` 进行表单管理和校验。
  - [ ] 在表单中，提供**分类选择器**（从 `Category` 接口获取数据）。
  - [ ] 对接 `create`, `update`, `delete` 等接口。
  - [ ] 实现产品列表的拖拽排序功能。

### 2.2. 分类管理 (新页面: `CategoryManagement.tsx`)

- [ ] **后端**: 创建 `CategoryController`，实现对 `ProductCategory` 模型的“增删改查”接口。
- [ ] **前端**:
  - [ ] 创建 `CategoryManagement.tsx` 页面。
  - [ ] 对接接口，以列表或卡片形式展示所有分类。
  - [ ] 实现新增/编辑分类的弹窗和表单。

### 2.3. 优惠券管理 (新页面)

- [ ] **后端**: 创建 `CouponController`，实现对 `Coupon` 模板的“增删改查”接口。
- [ ] **前端**:
  - [ ] 创建一个新的 `CouponManagement.tsx` 页面。
  - [ ] 实现优惠券模板的列表展示。
  - [ ] 实现一个复杂的、分步的“创建/编辑优惠券”表单，用于配置优惠券的各种规则。

---

## 第三阶段：运营与支持系统 (待开发)

**目标**: 根据补充设计文档，构建内容管理、客服工单等后台运营工具。

### 3.1. 内容管理 (CMS)

- [ ] **后端**: 创建 `BannerController` 和 `AdvertisementController`，实现对 Banner 和广告位的“增删改查”接口。
- [ ] **前端**:
  - [ ] 创建 `BannerManagement.tsx` 和 `AdManagement.tsx` 页面。
  - [ ] 实现 Banner 和广告的列表展示、预览和表单编辑功能。

### 3.2. 客服与帮助中心

- [ ] **后端**: 创建 `WorkOrderController` 和 `HelpFaqController`，实现对工单和常见问题的管理接口。
- [ ] **前端**:
  - [ ] 在 `ServiceCenter.tsx` 页面，实现工单列表、查看、回复功能。
  - [ ] 创建 `FaqManagement.tsx` 页面，实现对常见问题的增删改查。

### 3.3. 财务配置

- [ ] **后端**: 创建 `RechargeController`，实现对 `RechargeChannel` (充值渠道) 和 `RechargeOption` (充值选项) 的管理接口。
- [ ] **前端**: 在 `Finance.tsx` 页面的“配置” Tab 中，实现对充值渠道和充值选项的界面化管理。

---

## 第四阶段：高级功能与未来展望 (规划中)

**目标**: 为系统增加数据分析、精细化权限控制和审计能力。

- [ ] **数据分析**: 在 `DataAnalytics.tsx` 页面，对接真实的数据统计接口，替换当前的模拟图表。
- [ ] **权限角色管理 (RBAC)**:
  - [ ] **后端**: 创建 `RoleController`，实现对角色和权限的“增删改查”。
  - [ ] **前端**: 在 `AdminSecurity.tsx` 页面，实现一个可视化的角色和权限分配界面。
- [ ] **操作日志审计**:
  - [ ] **后端**: 创建 `AdminLogController`，提供对 `AdminOperationLog` 表的查询和筛选接口。
  - [ ] **前端**: 创建一个新页面，用于展示管理员的操作日志，支持按管理员、模块、时间范围进行查询。
