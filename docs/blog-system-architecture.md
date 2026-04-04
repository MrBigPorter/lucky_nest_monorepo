# 博客系统架构设计文档

## 1. 项目概述

### 1.1 系统目标

- 为现有Lucky Nest Monorepo添加博客功能
- 集成到现有admin-next管理后台
- 支持多用户权限管理
- 提供完整的博客管理功能

### 1.2 技术栈

- **后端**: NestJS + Prisma + PostgreSQL
- **前端**: Next.js 15 + Tailwind CSS
- **状态管理**: TanStack Query + React Query
- **认证**: 复用现有OAuth/JWT系统
- **部署**: Docker + Nginx

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  客户端 (Web)   │    │  管理后台 (Admin)│    │   移动端 (H5)   │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                       │                        │
          ▼                       ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js 15    │    │   Next.js 15     │    │   Next.js 15    │
│   App Router    │    │   App Router     │    │   App Router    │
│   SSR/SSG       │    │   SSR/SSG        │    │   SSR/SSG       │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                       │                        │
          ▼                       ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   RESTful API   │    │   RESTful API    │    │   RESTful API   │
│   (NestJS)      │    │   (NestJS)       │    │   (NestJS)      │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                       │                        │
          ▼                       ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   PostgreSQL     │    │   PostgreSQL    │
│   + Prisma      │    │   + Prisma       │    │   + Prisma      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 2.2 模块依赖关系

```
apps/
├── admin-next/          # 管理后台 (新增博客功能)
│   ├── src/
│   │   ├── app/        # Next.js路由
│   │   ├── components/ # 组件
│   │   ├── views/     # 页面 (新增Blog相关页面)
│   │   └── lib/       # 工具函数
│   └── prisma/        # 数据库 (新增博客表)
└── api/                # 现有API (新增博客接口)
    └── src/
        └── blog/      # 博客模块
```

## 3. 数据库设计

### 3.1 表结构设计

#### 文章表 (Article)

```sql
CREATE TABLE article (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, archived
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  author_id UUID NOT NULL REFERENCES user(id),
  category_id UUID REFERENCES category(id),
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0
);
```

#### 分类表 (Category)

```sql
CREATE TABLE category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES category(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 标签表 (Tag)

```sql
CREATE TABLE tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 评论表 (Comment)

```sql
CREATE TABLE comment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES article(id),
  author VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  parent_id UUID REFERENCES comment(id), -- 用于回复
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 文章标签关联表 (ArticleTag)

```sql
CREATE TABLE article_tag (
  article_id UUID NOT NULL REFERENCES article(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
```

### 3.2 Prisma Schema

```prisma
model Article {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  content     String
  excerpt     String?
  status      ArticleStatus @default(DRAFT)
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  author      User     @relation(fields: [authorId], references: [id])
  authorId    String
  category    Category? @relation(fields: [categoryId], references: [id])
  categoryId  String?
  viewCount   Int      @default(0)
  likeCount   Int      @default(0)
  commentCount Int     @default(0)
  tags        Tag[]
  comments    Comment[]
}

model Category {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  parentId    String?
  parent      Category? @relation('CategoryToCategory', fields: [parentId], references: [id])
  children    Category[] @relation('CategoryToCategory')
  articles    Article[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Tag {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  articles  Article[]
  createdAt DateTime @default(now())
}

model Comment {
  id        String   @id @default(cuid())
  article   Article  @relation(fields: [articleId], references: [id])
  articleId String
  author    String
  email     String
  content   String
  status    CommentStatus @default(PENDING)
  parentId  String?
  parent    Comment?    @relation('CommentToComment', fields: [parentId], references: [id])
  children  Comment[]   @relation('CommentToComment')
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
}
```

## 4. API设计

### 4.1 路由设计

#### 文章管理 (/v1/blog/articles)

- `GET /` - 获取文章列表
- `GET /:id` - 获取文章详情
- `POST /` - 创建文章
- `PUT /:id` - 更新文章
- `DELETE /:id` - 删除文章
- `POST /:id/publish` - 发布文章
- `POST /:id/unpublish` - 取消发布

#### 分类管理 (/v1/blog/categories)

- `GET /` - 获取分类列表
- `GET /:id` - 获取分类详情
- `POST /` - 创建分类
- `PUT /:id` - 更新分类
- `DELETE /:id` - 删除分类

#### 标签管理 (/v1/blog/tags)

- `GET /` - 获取标签列表
- `POST /` - 创建标签
- `DELETE /:id` - 删除标签

#### 评论管理 (/v1/blog/comments)

- `GET /` - 获取评论列表
- `GET /:id` - 获取评论详情
- `POST /` - 创建评论
- `PUT /:id` - 更新评论
- `DELETE /:id` - 删除评论
- `POST /:id/approve` - 审核通过
- `POST /:id/reject` - 驳回评论

### 4.2 DTO设计

#### 创建文章

```typescript
export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsArray()
  @IsOptional()
  tagIds?: string[];
}
```

#### 更新文章

```typescript
export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsArray()
  @IsOptional()
  tagIds?: string[];
}
```

## 5. 前端路由设计

### 5.1 管理后台路由 (apps/admin-next/src/app/(dashboard)/)

#### 博客管理面板

- `/dashboard/blog` - 博客管理首页
- `/dashboard/blog/articles` - 文章列表
- `/dashboard/blog/articles/create` - 创建文章
- `/dashboard/blog/articles/:id/edit` - 编辑文章
- `/dashboard/blog/categories` - 分类管理
- `/dashboard/blog/tags` - 标签管理
- `/dashboard/blog/comments` - 评论管理

### 5.2 博客展示路由 (apps/admin-next/src/app/)

#### 博客展示页面

- `/blog` - 博客首页
- `/blog/articles` - 文章列表
- `/blog/articles/:slug` - 文章详情
- `/blog/categories` - 分类列表
- `/blog/tags` - 标签列表
- `/blog/search` - 搜索结果

## 6. 组件设计

### 6.1 管理后台组件

#### 文章管理组件

- `ArticleList` - 文章列表
- `ArticleForm` - 文章表单
- `ArticleCard` - 文章卡片
- `ArticlePreview` - 文章预览

#### 分类管理组件

- `CategoryList` - 分类列表
- `CategoryForm` - 分类表单
- `CategoryTree` - 分类树形结构

#### 标签管理组件

- `TagList` - 标签列表
- `TagForm` - 标签表单
- `TagCloud` - 标签云

#### 评论管理组件

- `CommentList` - 评论列表
- `CommentForm` - 评论表单
- `CommentApproval` - 评论审核

### 6.2 博客展示组件

#### 博客展示组件

- `BlogLayout` - 博客布局
- `ArticleList` - 文章列表
- `ArticleDetail` - 文章详情
- `CategoryList` - 分类列表
- `TagCloud` - 标签云
- `SearchBox` - 搜索框
- `CommentSection` - 评论区

## 7. 权限设计

### 7.1 用户角色

- **超级管理员**: 完整博客管理权限
- **管理员**: 管理所有文章和评论
- **作者**: 只能管理自己发布的文章
- **访客**: 只能查看已发布文章

### 7.2 权限控制

- 文章创建: 管理员、作者
- 文章编辑: 文章作者、管理员
- 文章删除: 管理员
- 评论审核: 管理员
- 评论发布: 所有登录用户

## 8. 性能优化

### 8.1 后端优化

- **数据库索引**: 为常用查询字段创建索引
- **缓存策略**: 使用Redis缓存热点数据
- **分页查询**: 支持分页和游标查询
- **异步处理**: 使用队列处理耗时的操作

### 8.2 前端优化

- **代码分割**: 按路由分割代码
- **图片优化**: 使用Next.js Image组件
- **懒加载**: 延迟加载非关键资源
- **缓存策略**: 使用Service Worker缓存

## 9. SEO优化

### 9.1 文章SEO

- **语义化HTML**: 使用正确的HTML5标签
- **结构化数据**: 添加JSON-LD结构化数据
- **元标签**: 优化title、description、keywords
- **友好URL**: 使用slug作为URL

### 9.2 技术SEO

- **SSR渲染**: 使用Next.js SSR
- **sitemap**: 自动生成sitemap
- **robots.txt**: 配置robots.txt
- **页面速度**: 优化页面加载速度

## 10. 部署方案

### 10.1 容器化部署

- **Docker**: 多阶段构建优化镜像大小
- **Nginx**: 反向代理和负载均衡
- **CI/CD**: 自动化构建和部署

### 10.2 环境配置

- **开发环境**: 本地开发配置
- **测试环境**: 测试服务器配置
- **生产环境**: 生产服务器配置

## 11. 测试策略

### 11.1 单元测试

- **服务层测试**: 测试业务逻辑
- **控制器测试**: 测试API接口
- **DTO测试**: 测试数据验证

### 11.2 集成测试

- **API测试**: 测试端到端API
- **数据库测试**: 测试数据库操作
- **权限测试**: 测试权限控制

### 11.3 E2E测试

- **用户流程测试**: 测试用户操作流程
- **浏览器兼容性测试**: 测试不同浏览器
- **性能测试**: 测试系统性能

## 12. 监控和日志

### 12.1 系统监控

- **API监控**: 监控API调用情况
- **数据库监控**: 监控数据库性能
- **服务器监控**: 监控服务器资源使用

### 12.2 日志系统

- **访问日志**: 记录API访问日志
- **错误日志**: 记录系统错误日志
- **操作日志**: 记录用户操作日志

## 13. 安全考虑

### 13.1 数据安全

- **输入验证**: 验证所有用户输入
- **SQL注入**: 使用Prisma防止SQL注入
- **XSS攻击**: 过滤HTML内容
- **CSRF保护**: 使用CSRF令牌

### 13.2 权限安全

- **角色控制**: 严格的角色权限控制
- **数据隔离**: 用户只能访问自己的数据
- **操作审计**: 记录所有重要操作

## 14. 扩展性设计

### 14.1 插件系统

- **自定义字段**: 支持文章自定义字段
- **第三方集成**: 支持第三方服务集成
- **主题系统**: 支持主题切换

### 14.2 微服务准备

- **服务拆分**: 为未来微服务做准备
- **API网关**: 支持API网关集成
- **服务发现**: 支持服务发现机制

## 15. 开发计划

### 第1周: 后端开发

- [ ] 创建博客模块结构
- [ ] 实现文章、分类、标签、评论CRUD接口
- [ ] 集成现有认证和权限系统
- [ ] 编写API文档和测试

### 第2周: 前端开发

- [ ] 在admin-next中新增博客管理页面
- [ ] 实现文章管理功能
- [ ] 实现分类标签管理
- [ ] 实现评论审核功能
- [ ] 优化用户体验和性能

### 第3周: 优化和测试

- [ ] 性能优化
- [ ] SEO优化
- [ ] 安全测试
- [ ] 部署准备

## 16. 技术栈版本

### 后端技术栈

- **NestJS**: ^10.0.0
- **Prisma**: ^5.0.0
- **PostgreSQL**: ^14.0
- **Redis**: ^7.0

### 前端技术栈

- **Next.js**: ^15.0.0
- **React**: ^18.0.0
- **TypeScript**: ^5.0.0
- **Tailwind CSS**: ^3.0.0

## 17. 参考文档

### 后端参考

- [NestJS文档](https://docs.nestjs.com/)
- [Prisma文档](https://www.prisma.io/docs/)
- [PostgreSQL文档](https://www.postgresql.org/docs/)

### 前端参考

- [Next.js文档](https://nextjs.org/docs)
- [React文档](https://react.dev/)
- [Tailwind CSS文档](https://tailwindcss.com/docs)

## 18. 常见问题

### 18.1 性能问题

- **Q**: 文章列表加载慢
- **A**: 使用分页和缓存优化

### 18.2 权限问题

- **Q**: 用户权限不生效
- **A**: 检查Guards配置

### 18.3 部署问题

- **Q**: 部署后无法访问
- **A**: 检查Nginx配置和环境变量

## 19. 后续规划

### 19.1 近期规划

- **插件系统**: 支持第三方插件
- **多语言**: 支持多语言博客
- **移动端**: 优化移动端体验

### 19.2 长期规划

- **微服务**: 拆分为独立微服务
- **PWA**: 支持PWA应用
- **AI集成**: 集成AI写作助手

---

**文档版本**: 1.0.0  
**最后更新**: 2026-04-04  
**作者**: Lucky Nest Team
