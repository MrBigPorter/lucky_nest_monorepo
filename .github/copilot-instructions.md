# Lucky Nest Monorepo — Copilot Work Instructions

> **Important**: Always start each conversation by checking `## 🎯 Current Task`, follow the Phase progression, and do not work on unplanned tasks.

---

## 🎯 Current Task (Start Here for Each Conversation)

**Phase**: Phase 7 Blog System Development — Week 2 Frontend UI Refactoring & API Integration  
**Last Update**: Blog system admin panel UI refactored + API integration fixes (2026-04-04)  
**Immediate Action**:

### ✅ Blog System Week 2 Issues Fixed

**🎯 Problems Identified & Fixed**:

1. **✅ 404 Page Issues**: Fixed routing mismatch between `/dashboard/blog/articles/[id]/edit` and `/blog/articles/[id]/edit`
2. **✅ API Interface Missing**: Created complete blog system API interface in `apps/admin-next/src/api/index.ts`
3. **✅ Frontend-Backend Integration**: Updated blog edit page to use real API calls instead of mock data
4. **✅ Routing Consistency**: Fixed link paths in article list page to match actual routes

**📊 Current Status**:

| Page/Component             | Status      | API Integration       |
| -------------------------- | ----------- | --------------------- |
| 🏠 **Blog Dashboard**      | ✅ Complete | Mock data (needs API) |
| 📝 **Article List**        | ✅ Complete | Mock data (needs API) |
| ✏️ **Article Create/Edit** | ✅ Complete | ✅ **API Integrated** |
| 📂 **Category Management** | ✅ Basic    | Mock data (needs API) |
| 🏷️ **Tag Management**      | ✅ Basic    | Mock data (needs API) |
| 💬 **Comment Management**  | ✅ Basic    | Mock data (needs API) |

**🔧 Technical Improvements**:

- **API Interface**: Complete blog API interface with 26+ methods
- **Error Handling**: Proper error handling with toast notifications
- **Fallback Strategy**: Graceful fallback to mock data when API fails
- **Type Safety**: Full TypeScript support for API responses
- **Authentication**: Reuses existing AdminJwtAuthGuard for API protection

**🎯 Next Steps**:

1. **Complete API Integration**: Update remaining pages (article list, categories, tags, comments) to use real API
2. **TanStack Query**: Integrate for better data fetching and caching
3. **Testing**: Test all blog management functionality with running API server
4. **Public Blog Pages**: Start development of public blog display pages

---

## 📝 Blog System Development Checklist (New Task)

**Phase**: Phase 7 Blog System Development  
**Document Reference**: `docs/blog-system-architecture.md`  
**Estimated Timeline**: 3 weeks

### 🎯 Development Task Checklist

#### ✅ Week 1: Backend Development (API + Database)

- [x] **Database Models**: Add Article/Category/Tag/Comment models to `schema.prisma`
- [x] **Database Migration**: Generate and execute Prisma migration files
- [x] **Blog Module**: Create `apps/api/src/blog/` module
  - [x] BlogModule configuration
  - [x] BlogService business logic
  - [x] BlogController API endpoints
  - [x] DTO data validation
- [x] **Permission Integration**: Integrate existing AdminJwtAuthGuard and RolesGuard
- [x] **API Documentation**: Generate Swagger API documentation (Swagger decorators already included)
- [x] **Unit Tests**: Blog module unit test coverage (partially implemented, full tests can be added later)

#### ✅ Week 2: Frontend Development (Admin Panel + Blog Display)

- [x] **Admin Panel Routes**: Add blog management routes in `admin-next`
  - [x] `/dashboard/blog` - Blog management dashboard
  - [x] `/dashboard/blog/articles` - Article list
  - [x] `/dashboard/blog/articles/create` - Create article
  - [x] `/dashboard/blog/articles/[id]/edit` - Edit article
  - [x] `/dashboard/blog/categories` - Category management
  - [x] `/dashboard/blog/tags` - Tag management
  - [x] `/dashboard/blog/comments` - Comment management
- [ ] **Blog Display Routes**: Blog frontend pages
  - [ ] `/blog` - Blog homepage
  - [ ] `/blog/articles` - Article list
  - [ ] `/blog/articles/[slug]` - Article details
- [x] **Component Development**:
  - [x] ArticleList article list component (enhanced with professional design)
  - [x] ArticleForm article editing form (with RichTextEditor integration)
  - [x] CategoryList category management component (basic)
  - [x] TagList tag management component (basic)
  - [x] CommentList comment management component (basic)
- [x] **UI Design Refactoring**: Complete UI redesign using existing system design patterns
  - [x] Blog dashboard page using Card, Badge, PageHeader components
  - [x] Article list page with professional table design
  - [x] Integration with existing UIComponents library
  - [x] Dark mode support and consistent spacing system
- [ ] **State Management**: Integrate TanStack Query for data fetching
- [x] **Rich Text Editor**: Integrate article rich text editor (react-quill-new)
- [x] **Responsive Design**: Mobile-friendly page adaptation

#### ✅ Week 3: Optimization and Testing

- [ ] **Performance Optimization**: Article list pagination + caching
- [ ] **SEO Optimization**: SSR rendering + meta tags + structured data
- [ ] **Image Upload**: Article image upload functionality
- [ ] **Comment Features**: Comment submission and moderation
- [ ] **Search Functionality**: Article search functionality
- [ ] **Integration Tests**: API endpoint testing
- [ ] **E2E Tests**: End-to-end user flow testing
- [ ] **Deployment Preparation**: Production environment configuration

### 📋 Technology Stack Requirements

- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: Next.js 15 + App Router + Tailwind CSS v4
- **Editor**: TipTap / Plate rich text editor
- **Images**: Cloudflare R2 / local storage

### ⚠️ Important Notes

- Follow existing project code conventions
- Reuse existing authentication and permission systems
- API endpoint paths unified as `/admin/blog/*`
- New tables must have index optimization
- All user input must have validation

---

## 📋 Next Phase Candidate Directions (Phase 7)

Based on RUNBOOK.md and priority assessment, options include:

| Candidate                           | Description                                 | Priority  | Estimated Effort |
| ----------------------------------- | ------------------------------------------- | --------- | ---------------- |
| **Lighthouse Performance Review**   | Verify LCP < 500ms target                   | 🔴 High   | 2-3 days         |
| **Mobile Responsive Adaptation**    | Admin page adaptation for tablet/mobile     | 🟡 Medium | 3-5 days         |
| **Batch Operations**                | Order/user batch status changes, CSV export | 🟡 Medium | 3-4 days         |
| **Internationalization Completion** | Add zh translation keys for new pages       | 🟡 Medium | 1-2 days         |
| **@lucky/api lint debt cleanup**    | Backend lint standardization                | 🟢 Low    | Ongoing          |

> Awaiting user direction for next work priority.

---

## ✅ Completed Tasks Archive

Completed major refactors (route cleanup, Stage 1~6 refactoring, IM Phase mainline) are no longer detailed in this file. Refer to `read/` topic documentation and Git commit history.

---

## 🛡️ CI / Local Quality Gates (Context preserved, 2026-03-20)

- Baseline completed: Husky + `lint-staged` + CI baseline process implemented (see `RUNBOOK.md` 6.3)
- **Pre-commit hooks**: `lint-staged` runs ESLint + Prettier on staged files
- **CI pipeline**: GitHub Actions run on PRs:
  - TypeScript compilation check
  - ESLint validation
  - Unit tests (where applicable)
- **Local development**: Run `yarn lint` and `yarn type-check` before committing

### 🚀 Development Workflow

1. **Start development**: Check current phase in this document
2. **Implementation**: Follow existing patterns and conventions
3. **Testing**: Write tests for new functionality
4. **Code review**: Ensure code quality and consistency
5. **Documentation**: Update relevant documentation

### ⚠️ Next.js 15 Server Actions 开发注意事项

#### 函数 Props 命名规范

- 在 "use client" 组件中传递的函数 props 必须以 "Action" 结尾
- 确保函数可以被序列化，在客户端和服务器端之间安全传递
- 这是 Next.js 15 的新安全特性，防止函数 props 被错误地序列化

#### 常见错误修复模式

- **修复前**: `onClose={() => setIsModalOpen(false)}`
- **修复后**: `onCloseAction={() => setIsModalOpen(false)}`
- **修复前**: `onSuccess={refresh}`
- **修复后**: `onSuccessAction={refresh}`

#### API 定义规范

- 遵循现有 `authApi`、`uploadApi` 模式
- 使用清晰的注释说明每个 API 方法的作用
- 包含必要的请求头配置（如 `x-skip-auth-refresh: '1'`）
- 使用 TypeScript 类型确保类型安全

#### 组件接口一致性

- Modal 组件期望的 prop：`onCloseAction: () => void`
- 调用方传递的 prop 必须匹配：`onCloseAction={() => setIsModalOpen(false)}`
- 避免 TS2322 错误：属性 'onClose' 不存在于类型中

### 📚 Project Structure Reference

```
apps/
├── admin-next/          # Next.js admin frontend
├── api/                 # NestJS backend API
└── liveness-web/        # Health check web app

packages/
├── shared/              # Shared utilities and types
├── ui/                  # UI component library
├── eslint-config/       # ESLint configurations
├── typescript-config/   # TypeScript configurations
└── config/              # Build configurations
```

### 🔧 Common Commands

```bash
# Development
yarn dev                 # Start all services in development mode
yarn dev:api             # Start only API backend
yarn dev:admin           # Start only admin frontend

# Code quality
yarn lint                # Run ESLint on all packages
yarn type-check          # Run TypeScript type checking
yarn format              # Format code with Prettier

# Database
yarn db:migrate          # Run database migrations
yarn db:generate         # Generate Prisma client
yarn db:seed             # Seed database with test data

# Testing
yarn test                # Run all tests
yarn test:api            # Run API tests
yarn test:admin          # Run admin frontend tests
```

### 🎯 Current Focus Areas

1. **Blog System Development** (Phase 7 - Active)
   - ✅ **Frontend Admin Panel**: UI refactoring completed with existing design patterns
   - 🔄 **Blog Display Pages**: Public blog frontend pages (next priority)
   - ✅ **Rich Text Editor**: Integrated react-quill-new for article editing
   - 🔄 **Data Integration**: TanStack Query integration for API data fetching

2. **Code Quality** (Ongoing)
   - ✅ **TypeScript**: All errors fixed, strict mode compliance
   - ✅ **ESLint/Prettier**: Code formatting and linting standards maintained
   - 🔄 **Testing**: Unit and integration test coverage improvement
   - ✅ **Documentation**: Copilot instructions updated with latest progress

3. **Performance** (Upcoming)
   - **Lighthouse Performance Review**: Verify LCP < 500ms target
   - **Mobile Responsive Adaptation**: Admin page adaptation for tablet/mobile
   - **Caching Implementation**: API response caching and optimization
   - **SEO Optimization**: SSR rendering + meta tags for blog pages

---

**Last Updated**: 2026-04-04  
**Next Review**: After Week 2 frontend completion
