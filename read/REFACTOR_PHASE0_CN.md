# Next Admin — Phase 0 重构迭代记录

> **文档定位**：技术决策 + 改造过程记录，供团队迭代参考和新人学习。  
> **改造日期**：2026-03-16  
> **改造范围**：admin-next 基础设施（Phase 0），不涉及页面逻辑改动。  
> **前置文档**：[SSR 升级完整分析](./SSR_UPGRADE_ANALYSIS_CN.md)

---

## 目录

1. [改造背景与目标](#一改造背景与目标)
2. [技术点 1：output 模式切换](#二技术点-1output-模式切换)
3. [技术点 2：Zustand persist 持久化](#三技术点-2zustand-persist-持久化)
4. [技术点 3：防主题闪烁（FOUC）内联 Script](#四技术点-3防主题闪烁fouc内联-script)
5. [技术点 4：Dockerfile 多阶段 Standalone 构建](#五技术点-4dockerfile-多阶段-standalone-构建)
6. [技术点 5：Docker Compose — builder 变 service](#六技术点-5docker-compose--builder-变-service)
7. [技术点 6：Nginx 从静态文件改为反向代理](#七技术点-6nginx-从静态文件改为反向代理)
8. [技术点 7：CI/CD 从 Cloudflare Pages 迁到 VPS](#八技术点-7cicd-从-cloudflare-pages-迁到-vps)
9. [技术点 8：GitHub Actions 缓存禁用策略](#九技术点-8github-actions-缓存禁用策略)
10. [验证清单](#十验证清单)
11. [常见坑与防范](#十一常见坑与防范)
12. [下一阶段计划（Phase 1）](#十二下一阶段计划phase-1)

---

## 一、改造背景与目标

### 1.1 改造前的状态

```
生产部署链路（改造前）：
next build
  → output: 'export'        ← 纯静态 HTML/JS/CSS
  → apps/admin-next/out/    ← 静态文件目录
  → Cloudflare Pages CDN    ← 全球边缘节点分发

特点：
  ✅ 部署简单，CDN 极快
  ❌ Middleware 不生效（静态导出不支持）
  ❌ Server Components 不可用
  ❌ 认证靠 localStorage + 客户端 Guard（每次刷新闪烁）
  ❌ 主题刷新后重置（Zustand 无持久化）
```

### 1.2 改造目标（Phase 0）

Phase 0 只做基础设施准备，**不改任何页面逻辑**，让后续 Phase 1（认证）、Phase 2（SSR 数据预取）有落脚点：

```
改造后部署链路：
next build
  → output: 'standalone'    ← Node.js 服务器
  → .next/standalone/       ← 完整 server.js
  → Docker 镜像             ← 推送到 GHCR
  → VPS (Docker Compose)    ← 与后端同机部署
  → Nginx 反向代理          ← SSL 终止 + 静态资源缓存
```

**核心原则：每步改动向下兼容，不引入新报错。**

---

## 二、技术点 1：output 模式切换

### 2.1 为什么要改

Next.js 有三种 output 模式：

| 模式 | 产物 | 部署方式 | SSR/Middleware 支持 |
|------|------|---------|-------------------|
| `export`（旧） | `out/` 静态文件 | 任何静态 CDN | ❌ 不支持 |
| `standalone`（新） | `.next/standalone/server.js` | Node.js 进程 | ✅ 完整支持 |
| 默认（无配置） | `.next/` | Node.js 或 Vercel | ✅ 完整支持 |

**选 `standalone` 而不是默认模式的原因**：standalone 会把 Next.js 服务器和所需的 `node_modules` 精简打包进一个目录，Docker 镜像体积更小（省去安装 node_modules 的步骤）。

### 2.2 改动内容

```typescript
// ❌ 改造前 — next.config.ts
const isProd = process.env.NODE_ENV === 'production';
const nextConfig: NextConfig = {
  ...(isProd ? { output: 'export' } : {}),  // 条件静态导出
};

// ✅ 改造后
const nextConfig: NextConfig = {
  output: 'standalone',  // 始终使用 standalone
};
```

### 2.3 关键原理：standalone 产物结构

```
apps/admin-next/.next/
├── standalone/                  ← 独立运行目录（Docker 只需要这个）
│   ├── apps/admin-next/
│   │   └── server.js            ← 启动入口
│   ├── node_modules/            ← 精简版依赖（仅包含运行时需要的）
│   └── package.json
├── static/                      ← 静态资源（需手动复制到 standalone）
└── cache/
```

**⚠️ 易踩坑**：standalone 目录本身**不包含** `.next/static/` 和 `public/`，Dockerfile 里必须手动 COPY：

```dockerfile
# ✅ 正确做法
COPY --from=builder /app/apps/admin-next/.next/standalone ./
COPY --from=builder /app/apps/admin-next/.next/static     ./apps/admin-next/.next/static
COPY --from=builder /app/apps/admin-next/public           ./apps/admin-next/public
```

### 2.4 验证方法

```bash
# 构建后检查 server.js 是否存在
ls apps/admin-next/.next/standalone/apps/admin-next/server.js

# 本地启动验证
PORT=4001 node apps/admin-next/.next/standalone/apps/admin-next/server.js
# 访问 http://localhost:4001 应正常渲染
```

---

## 三、技术点 2：Zustand persist 持久化

### 3.1 问题描述

这是改造前**已存在的 Bug**（与 SSR 无关）：

```typescript
// ❌ 改造前 — useAppStore.ts（两个问题）

// 问题 1：没有持久化，刷新后主题重置
export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',  // ← 每次刷新都从这里开始，用户设置的 light 丢失

// 问题 2：在 Zustand action 里直接操作 DOM（反模式）
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.remove('light', 'dark');  // ← 不该在 action 里做！
      document.documentElement.classList.add(newTheme);
      return { theme: newTheme };
    }),
}));
```

**问题 2 的危害**：
- Zustand 的 `set()` 应该是纯状态更新，不做 side effect
- 升级 SSR 后，Server Component 环境没有 `document`，执行时会崩溃
- `Providers.tsx` 里已经有 `useEffect` 做同样的事，**两处逻辑互相干扰**

### 3.2 修复方案

```typescript
// ✅ 改造后 — useAppStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      lang: 'en',
      isSidebarCollapsed: false,
      // ✅ action 只更新状态，不碰 DOM
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      // ...
    }),
    {
      name: 'app-store',  // localStorage 的 key 名称
      storage: createJSONStorage(() => {
        // ✅ SSR 安全：服务端没有 localStorage，返回空实现防止崩溃
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
      // ✅ 只持久化 theme 和 lang，sidebar 折叠状态不持久化（每次进来默认展开更合理）
      partialize: (state) => ({ theme: state.theme, lang: state.lang }),
    },
  ),
);
```

### 3.3 persist 中间件工作原理

```
初始化流程：
1. create() 被调用
2. persist 中间件介入：读取 localStorage['app-store']
3. 如果找到已存的值（如 { theme: 'light', lang: 'zh' }），merge 进初始状态
4. 后续每次 set() 后，persist 自动将 partialize 的字段写回 localStorage

localStorage 存储格式：
{
  "state": { "theme": "light", "lang": "en" },
  "version": 0
}
```

### 3.4 DOM 操作放在哪里

DOM 操作（给 `<html>` 加 class）由 `Providers.tsx` 的 `useEffect` 负责：

```typescript
// Providers.tsx — 这里是 DOM 操作的唯一地点
useEffect(() => {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
}, [theme]);
// ✅ theme 变化时自动触发，persist 恢复后也会触发
```

**职责分离原则**：
- `useAppStore`：负责状态管理 + 持久化（纯逻辑）
- `Providers`：负责把状态同步到 DOM（副作用）

---

## 四、技术点 3：防主题闪烁（FOUC）内联 Script

### 4.1 问题描述

FOUC = **Flash of Unstyled Content**（内容样式闪烁）

```
升级 SSR 后的时间线（如果不处理）：

0ms   → 服务端渲染 HTML，此时 Zustand 还没初始化，<html> 没有 theme class
100ms → 浏览器收到 HTML → 页面以默认样式显示（通常是白色/亮色）
600ms → JS 执行 → Zustand persist 从 localStorage 读取 theme='dark'
601ms → Providers useEffect 触发 → document.documentElement.classList.add('dark')
601ms → 页面突然变黑 ← 用户肉眼可见！

用户体验：进页面先看到白色，然后突然变黑色 → 非常难看
```

### 4.2 解决方案：内联 Script

在 `<head>` 里放一段**同步执行**的 JS，在浏览器解析 HTML 时立即设置 class，早于 React hydrate：

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          这段 script 在浏览器解析 HTML 时同步执行（阻塞），
          比 React hydrate（600ms 后）早得多。
          从 localStorage 读 app-store 的 theme，立即加到 <html> 上。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try{
                var s=JSON.parse(localStorage.getItem('app-store')||'{}');
                var t=(s.state&&s.state.theme)||'dark';
                document.documentElement.classList.add(t);
              }catch(e){
                document.documentElement.classList.add('dark');
              }
            })();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**为什么要用 `dangerouslySetInnerHTML`**：

React 会转义 `<script>` 内容防 XSS，用 `dangerouslySetInnerHTML` 绕过转义，直接注入原始 JS。这里是安全的，因为内容是我们写的，不是用户输入。

**为什么要 `suppressHydrationWarning`**：

服务端渲染 `<html>` 时没有 theme class，客户端 hydrate 后发现 class 不同，React 会报 hydration mismatch 警告。`suppressHydrationWarning` 告诉 React 忽略这个属性的差异。

### 4.3 执行时序对比

```
处理后的时间线：

0ms   → 服务端渲染 HTML，<html> 没有 theme class（正常）
100ms → 浏览器解析 <head>，遇到内联 script → 同步执行
101ms → localStorage 读取 theme='dark' → <html class="dark">  ← 立即生效！
        （用户根本看不到白屏，因为 CSS 还没开始渲染）
600ms → React hydrate → 检测到 class 存在 → suppressHydrationWarning 忽略差异
601ms → Providers useEffect → 确认 class，无需改变

用户体验：无任何闪烁 ✅
```

### 4.4 与 `app-store` 的 key 保持一致

内联 script 读取的 localStorage key `'app-store'` **必须**与 Zustand persist 的 `name` 配置相同：

```typescript
// useAppStore.ts
persist(/*...*/, {
  name: 'app-store',  // ← 这里定义 key
})

// layout.tsx 内联 script
localStorage.getItem('app-store')  // ← 必须一致！
```

---

## 五、技术点 4：Dockerfile 多阶段 Standalone 构建

### 5.1 旧方案 vs 新方案

```
旧方案（output: 'export'）：
  Stage 1: Builder → yarn install + next build → out/ 静态文件
  Stage 2: busybox  → 复制 out/ → 容器退出（通过 volume 共享给 nginx）

  问题：busybox 只是个文件复制容器，本身不运行服务器
       必须配合 nginx static file serving
       不支持任何 Server 端特性

新方案（output: 'standalone'）：
  Stage 1: node:20-bullseye-slim → yarn install + next build → .next/standalone/
  Stage 2: node:20-alpine         → 复制 standalone 产物 → 运行 server.js

  优点：独立运行，nginx 只做反向代理
       支持 SSR / Middleware / Server Actions
       镜像体积比 Stage 1 小 80%（无 build 工具）
```

### 5.2 镜像体积优化策略

```dockerfile
# Stage 1: 构建（~1.2GB — 有 yarn, python, make, g++ 等）
FROM node:20-bullseye-slim AS builder
RUN apt-get install -y python3 make g++ openssl  # 编译 native 模块需要
RUN yarn install --immutable
RUN next build

# Stage 2: 运行（~180MB — 只有 Node.js + 精简 node_modules）
FROM node:20-alpine AS runner
# ⚠️ 只复制 standalone 产物，不复制 node_modules 源码
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
COPY --from=builder /app/public           ./public
# 最终镜像不包含任何构建工具
```

**体积对比**：

| 阶段 | 包含内容 | 大小 |
|------|---------|------|
| Builder | node + yarn + python + g++ + 全量 node_modules + 源码 | ~1.2 GB |
| Runner（最终镜像） | node + standalone精简依赖 + 构建产物 | ~180 MB |

### 5.3 非 root 用户（安全最佳实践）

```dockerfile
# ✅ 创建非 root 用户运行 Node.js
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# 文件归属给新用户
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

USER nextjs  # ← 以非 root 身份运行
```

**为什么重要**：如果容器被攻击，攻击者只有 nextjs 用户权限，无法修改系统文件。

### 5.4 环境变量注入时机

```dockerfile
# NEXT_PUBLIC_* 变量在 BUILD TIME 注入（编译进 JS bundle）
# 不能在容器启动时通过 -e 覆盖！
ARG NEXT_PUBLIC_API_BASE_URL=https://api.joyminis.com
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN yarn workspace @lucky/admin-next build  # ← 构建时烧录进去
```

**原理**：Next.js 在 build 时将 `NEXT_PUBLIC_*` 变量替换成字符串字面量，运行时修改环境变量不生效。如果需要运行时可变的配置，要用 `runtime config` 或 API 接口传递。

---

## 六、技术点 5：Docker Compose — builder 变 service

### 6.1 旧架构的问题

```yaml
# ❌ 旧方案 — 静态文件 Volume 共享模式
admin-builder:
  profiles: [local]             # 需要 --profile local 才启动
  build:
    dockerfile: apps/admin-next/Dockerfile.prod
  volumes:
    - admin_dist:/app/.../out   # 把 out/ 挂载到共享 volume

nginx:
  volumes:
    - admin_dist:/var/www/admin # nginx 从 volume 读静态文件
```

**问题链**：
1. `admin-builder` 是一次性构建容器（`busybox`），运行完就退出
2. nginx 必须等 admin-builder 把文件写到 volume 才能服务
3. 需要 `--profile local` 手动激活，CI 和本地逻辑不统一
4. nginx 重启或 volume 丢失，就没有静态文件了

### 6.2 新架构：持久运行的服务

```yaml
# ✅ 新方案 — 独立运行的 Node.js 服务
admin-next:
  image: ${ADMIN_IMAGE:-lucky-admin-next-prod:latest}
  container_name: lucky-admin-next-prod
  restart: unless-stopped       # 像其他服务一样持久运行
  environment:
    - PORT=3001
    - HOSTNAME=0.0.0.0
  expose:
    - "3001"                     # 只对内部网络暴露
  healthcheck:
    test: ["CMD-SHELL", "wget -qO- http://localhost:3001/ >/dev/null 2>&1 || exit 1"]
  networks: [app]

nginx:
  depends_on:
    admin-next:
      condition: service_healthy  # nginx 等 admin-next 健康才启动
```

**对比**：

| 维度 | 旧（builder + volume） | 新（service） |
|------|----------------------|-------------|
| 运行模式 | 一次性构建后退出 | 持续运行，自动重启 |
| 健康检查 | 无 | ✅ 有 |
| nginx 依赖 | 共享 volume | 网络内服务 |
| 服务发现 | 文件系统 | DNS（admin-next） |
| SSR 支持 | ❌ | ✅ |

---

## 七、技术点 6：Nginx 从静态文件改为反向代理

### 7.1 配置对比

```nginx
# ❌ 旧配置 — 直接 serve 静态文件
server {
    server_name admin.joyminis.com;
    root /var/www/admin;                        # 从 volume 读文件

    location / {
        try_files $uri $uri/ $uri/index.html /index.html;  # SPA 路由
    }
    location ~* \.(js|css|...)$ {
        expires 1y;
    }
}

# ✅ 新配置 — 反向代理 Node.js 服务器
server {
    server_name admin.joyminis.com;

    # Next.js 内容哈希静态资源 — 永久缓存（安全）
    location /_next/static/ {
        proxy_pass http://admin-next:3001;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # SSR 页面 — 不缓存（每次请求都走 Node.js）
    location / {
        proxy_pass http://admin-next:3001;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-store";
    }

    # API 依然转发后端
    location /api/ {
        proxy_pass http://backend:3000;
    }
}
```

### 7.2 缓存策略设计

```
为什么 /_next/static/ 可以永久缓存？

Next.js 对静态资源的文件名加了内容哈希：
  _next/static/chunks/18-8b56be167a46b23e.js   ← 哈希值随内容变化

文件内容变了 → 哈希变了 → 文件名变了 → 浏览器视为全新文件 → 不使用旧缓存
所以设置 max-age=31536000 (1年) + immutable 是安全的

为什么 / (SSR页面) 不能缓存？

SSR 页面由 Node.js 动态生成，同一 URL 不同用户看到不同内容（认证状态不同）
缓存 SSR 页面会导致 A 用户看到 B 用户的数据 → 严重安全问题
```

---

## 八、技术点 7：CI/CD 从 Cloudflare Pages 迁到 VPS

### 8.1 迁移原因

| 维度 | Cloudflare Pages（旧） | VPS Docker（新） |
|------|----------------------|----------------|
| 部署方式 | wrangler 上传静态文件 | GHCR 推 Docker 镜像 |
| SSR 支持 | ❌ 静态导出 | ✅ Node.js 全功能 |
| Middleware | ❌ 生产不生效 | ✅ 正常工作 |
| 费用 | 免费（有限制） | 已有 VPS，额外成本极低 |
| 与后端同机 | 不可能 | ✅ 同一 Docker 网络，内网通信 |

### 8.2 新 CI/CD 流程

```
Git push main
    ↓
[GitHub Actions: build job]
    1. actions/checkout
    2. docker/setup-buildx-action
    3. docker/login-action → GHCR
    4. docker/metadata-action → 生成标签（SHA + latest）
    5. docker/build-push-action → 构建 + 推送
       - 传入 build-args (NEXT_PUBLIC_* 环境变量)
       - 不使用 GHA cache（存储空间不足）
    ↓
[GitHub Actions: deploy job]
    6. appleboy/ssh-action → SSH 到 VPS
    7. docker pull 新镜像
    8. docker compose up --force-recreate admin-next
    9. 健康检查循环（最多 60s）
    10. 失败 → 自动回滚到旧镜像
    ↓
[GitHub Actions: notify]
    11. Telegram 通知（成功/失败）
```

### 8.3 关键设计：与后端部署保持一致

admin 的 CI/CD 与 backend 采用完全相同的模式：

```
相同点：
  - 都用 GHCR 存储镜像
  - 都用 appleboy/ssh-action SSH 部署
  - 都有健康检查 + 自动回滚
  - 都发 Telegram 通知
  
这样做的好处：
  - 维护一套逻辑即可
  - 出问题时排查路径相同
  - 新人只需学一套部署流程
```

### 8.4 `NEXT_PUBLIC_*` 变量的特殊处理

```yaml
# deploy-admin.yml
- name: Build & Push
  uses: docker/build-push-action@v6
  with:
    build-args: |
      NEXT_PUBLIC_API_BASE_URL=${{ secrets.NEXT_PUBLIC_API_BASE_URL }}
      NEXT_PUBLIC_APP_ENV=production
```

**⚠️ 注意**：`NEXT_PUBLIC_*` 必须在 `build-args` 里传，不能用 `env:` 传给容器运行时。原因见[技术点 4 的 5.4 节](#54-环境变量注入时机)。

---

## 九、技术点 8：GitHub Actions 缓存禁用策略

### 9.1 为什么禁用

GitHub Actions 缓存（`actions/cache@v4`）存在 GitHub 的服务器上，空间有限（每个仓库 10GB）。当项目有大量 `node_modules` 和 Docker layer 缓存时，很快就满了：

```
当前项目缓存消耗估算：
  Yarn cache (.yarn/cache): ~500MB
  node_modules (多个 workspace): ~1.5GB
  Docker layer GHA cache: ~2GB（backend + admin 各一份）
  Playwright browsers: ~300MB
  
  总计: ~4.3GB → 接近 10GB 上限时 CI 开始报 cache miss 或覆盖失败
```

### 9.2 被注释的缓存项

```yaml
# ci.yml — 注释了以下缓存
# - Yarn zip cache (.yarn/cache)          ← 节省 ~500MB
# - node_modules cache                    ← 节省 ~1.5GB
# - Turbo remote cache (.turbo)           ← 节省 ~100MB
# - Playwright browsers cache             ← 节省 ~300MB

# deploy-admin.yml
# - Yarn cache                            ← 同上
# - node_modules cache                    ← 同上

# deploy-backend.yml
# - Docker layer GHA cache (cache-from/to) ← 节省 ~2GB
```

### 9.3 禁用后的影响

| 流程 | 有缓存 | 无缓存 | 差值 |
|------|--------|--------|------|
| CI check (yarn install) | ~2分钟 | ~4分钟 | +2分钟 |
| CI E2E (playwright) | ~5分钟 | ~7分钟 | +2分钟 |
| backend Docker build | ~8分钟 | ~15分钟 | +7分钟 |
| admin Docker build | ~10分钟 | ~18分钟 | +8分钟 |

**结论**：每次 CI 慢约 10-15 分钟，但不会因存储满了导致 CI 失败。

### 9.4 后续方案：切换到 Docker Hub 缓存

Docker Hub 提供独立的镜像层缓存，不占 GitHub 空间：

```yaml
# 未来切换方案（TODO）
- name: Build & Push
  uses: docker/build-push-action@v6
  with:
    # 从注释改为：
    cache-from: type=registry,ref=your-dockerhub/lucky-admin-next-cache
    cache-to: type=registry,ref=your-dockerhub/lucky-admin-next-cache,mode=max
```

**恢复步骤**（存储清理后）：
1. 在仓库 Settings → Actions → Caches 页面手动清除旧缓存
2. 将 `ci.yml` 和 `deploy-*.yml` 中注释掉的 `actions/cache@v4` 步骤解除注释
3. 确认 `if: steps.nm-cache.outputs.cache-hit != 'true'` 条件也恢复（必须与 cache step 的 `id` 对应）

---

## 十、验证清单

### 10.1 本地验证

```bash
# 1. pre-build 依赖包
node packages/shared/scripts/build.js
node packages/ui/scripts/build.js

# 2. 构建 admin-next（验证 standalone 产物）
NODE_ENV=production yarn workspace @lucky/admin-next build

# 3. 检查 server.js 是否生成
ls apps/admin-next/.next/standalone/apps/admin-next/server.js

# 4. 本地启动 standalone 服务器
PORT=4001 node apps/admin-next/.next/standalone/apps/admin-next/server.js
# 访问 http://localhost:4001 → 应正常显示登录页

# 5. 验证主题持久化（刷新后不重置）
# 打开页面 → 切到亮色主题 → F5 刷新 → 应仍是亮色

# 6. 验证无 FOUC（主题不闪烁）
# 打开页面 → 查看 Network → 不应看到先白后黑的切换
```

### 10.2 Docker 开发环境验证

```bash
# 启动 admin-next 容器
docker compose --env-file deploy/.env.dev up -d admin-next

# 查看启动日志（等待 Ready 出现）
docker compose logs -f admin-next

# 成功标志：
# ✓ Compiled middleware in xxx ms
# ✓ Ready in x.xs

# 验证 HTTP 访问（307 = Middleware 正常跳转登录页）
curl -sk https://admin-dev.joyminis.com/ -o /dev/null -w "HTTP %{http_code}\n"
# 应输出：HTTP 307

# ⚠️ 容器启动异常时，使用万能修复命令（见坑 7/8）：
# docker rm -f lucky-admin-next-dev
# docker volume rm lucky_nest_monorepo_admin_next_build lucky_nest_monorepo_admin_next_nm
# docker compose --env-file deploy/.env.dev up -d admin-next
```

### 10.2 Docker 本地验证

```bash
# 构建 Docker 镜像
docker build \
  --platform linux/amd64 \
  -f apps/admin-next/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.joyminis.com \
  -t lucky-admin-next-prod:latest \
  .

# 运行容器
docker run --rm -p 3001:3001 lucky-admin-next-prod:latest

# 访问 http://localhost:3001
```

### 10.3 生产验证（部署后）

```bash
# SSH 到 VPS
ssh root@107.175.53.104

# 检查容器状态
docker compose -f /opt/lucky/compose.prod.yml ps

# 检查 admin-next 日志
docker logs lucky-admin-next-prod --tail=50

# 健康检查
curl -I https://admin.joyminis.com
```

---

## 十一、常见坑与防范

### 坑 1：`NEXT_PUBLIC_*` 运行时不生效

```
症状：修改了容器的环境变量，但前端 API 地址没有变

原因：NEXT_PUBLIC_* 在 next build 时被内联为字符串
     容器运行时的环境变量对它们无效

防范：必须在 build-args 里传，重新构建镜像才生效
```

### 坑 2：standalone 缺少静态文件

```
症状：页面加载后 CSS/JS 404

原因：.next/standalone/ 不包含 .next/static/ 和 public/
     需要手动 COPY 到 standalone 目录

防范：Dockerfile 里三个 COPY 缺一不可：
  COPY .next/standalone ./
  COPY .next/static     ./.next/static   ← 必须！
  COPY public           ./public          ← 必须！
```

### 坑 3：禁用 cache 后忘记移除 `if: cache-hit` 条件

```yaml
# ❌ 错误：cache step 被注释，但条件还在
# - name: Cache node_modules
#   id: nm-cache
#   ...

- name: Install dependencies
  if: steps.nm-cache.outputs.cache-hit != 'true'  # ← nm-cache 不存在！
  run: yarn install --immutable                     # ← 永远不会执行！

# ✅ 正确：同时移除条件
- name: Install dependencies
  run: yarn install --immutable  # 无条件执行
```

**这个坑会导致 `yarn install` 被跳过，后续步骤全部失败，而且报错信息不直观。**

### 坑 4：healthcheck 路径写错

```yaml
# ❌ 错误：Next.js standalone 没有 /api/health 路径
test: ["CMD-SHELL", "wget -qO- http://localhost:3001/api/health >/dev/null 2>&1 || exit 1"]

# ✅ 正确：用根路径
test: ["CMD-SHELL", "wget -qO- http://localhost:3001/ >/dev/null 2>&1 || exit 1"]
```

### 坑 5：Zustand persist + SSR 的 hydration mismatch

```
症状：React 报 hydration warning，主题闪烁

原因：服务端 Zustand 初始值是 theme:'dark'（代码默认）
     客户端从 localStorage 读出 theme:'light'
     服务端 HTML 的 <html> 没有 class，客户端 hydrate 后加了 class
     React 检测到不一致

防范：
  1. app/layout.tsx 加 suppressHydrationWarning
  2. 加内联 script 在 hydrate 前同步 theme（技术点 3）
  3. Zustand persist 的 SSR 安全 storage（技术点 2.2）
```

### 坑 6：`trailingSlash: true` 与 standalone 的兼容

```
配置了 trailingSlash: true 后，路由是 /users/ 而不是 /users
nginx 反向代理时不需要特殊处理（Next.js server 自动处理重定向）
但如果 nginx 有 try_files 逻辑需要注意（proxy_pass 不需要 try_files）
```

---

### 坑 7：编辑工具多次写文件导致 Next.js 热重载读到中间状态（实战记录）

**触发场景**：用 AI 编辑工具修改 `next.config.ts` 时，工具分多次写入文件（先替换部分内容，再替换另一部分），两次写入之间产生了一个语法错误的中间状态。`next dev` 的文件监听器正好在这个时机触发 reload，读到了语法错误的 config 并崩溃退出。

**错误现象**：

```
⚠ Found a change in next.config.ts. Restarting the server to apply the changes...
[Error:   x Expected ';', '}' or <eof>
    ,-[7:1]
  4 |     // standalone 模式...
  7 | ,-> output: 'standalone',    ← 属性浮在对象外面，语法错误
```

**根因**：
```
时间线：
  T1: 工具写入第一次修改 → next.config.ts 变成中间状态（语法错误）
  T2: next dev 检测到文件变化 → 触发 reload → 读取中间状态 → 崩溃退出
  T3: 工具完成第二次修改 → 文件恢复正确 → 但容器已经退出了

容器使用的 .next 缓存（volume: admin_next_build）里保存了崩溃时的编译产物，
下次启动时 Next.js 读缓存 → 仍然报同样错误 → 无限崩溃循环
```

**修复方法**：清除 `.next` build cache volume，让 Next.js 从头编译：

```bash
docker rm -f lucky-admin-next-dev
docker volume rm lucky_nest_monorepo_admin_next_build
docker compose --env-file deploy/.env.dev up -d admin-next
```

---

### 坑 8：清除 build cache 后出现 `command not found: next`（实战记录，紧接坑 7）

**触发场景**：清除 `admin_next_build` volume 后重启容器，容器显示 `yarn.lock unchanged - skipping install`，随后报 `command not found: next`。

**错误现象**：

```
>>> yarn.lock unchanged - skipping install
✅ @lucky/shared built ...
✅ @repo/ui built ...
command not found: next          ← next 找不到了
```

**根因**：

```
Docker volume 挂载结构：
  .:/app                                    ← 整个项目（含 apps/admin-next/）
  admin_next_nm:/app/node_modules           ← 根 node_modules（独立 volume）
  admin_next_build:/app/apps/admin-next/.next  ← .next 缓存（刚被清除重建）

问题链：
  admin_next_build 被清除 → 重新创建为空 volume
  新空 volume 里没有 .next/cache/
  → Next.js 认为 dependencies 状态未知
  → 但 admin_next_nm volume 是老版本的（可能来自更早的 base 镜像时代）
  → 里面的 node_modules/.bin/next 路径对不上当前 yarn workspace 结构
  → yarn 无法解析 next 命令 → command not found
```

**修复方法**：同时清除 `node_modules` volume，强制重新执行 `yarn install`：

```bash
docker rm -f lucky-admin-next-dev
docker volume rm lucky_nest_monorepo_admin_next_build lucky_nest_monorepo_admin_next_nm
docker compose --env-file deploy/.env.dev up -d admin-next
# ⏳ 首次安装约 2 分钟，然后 Next.js 编译约 1 分钟
```

**验证成功标志**：

```
lucky-admin-next-dev  | ➤ YN0000: Done with warnings in 1m 54s   ← yarn install 完成
lucky-admin-next-dev  | ✅ @lucky/shared built ...
lucky-admin-next-dev  | ✅ @repo/ui built ...
lucky-admin-next-dev  | ✓ Compiled middleware in 366ms
lucky-admin-next-dev  | ✓ Ready in 2.3s                          ← 启动成功
```

访问 `https://admin-dev.joyminis.com` → HTTP 307 跳转到 `/login` → **Middleware 正常工作** ✅

---

### 坑 9：去掉 `dynamic(ssr:false)` 后，react-quill-new SSR 崩溃（实战记录）

**触发场景**：移除 `(dashboard)/layout.tsx` 的 `dynamic(ssr:false)` 后，所有 dashboard 页面开始 SSR，`/admin-users/` 等页面返回 500。

**错误现象**：

```
> 3  import ReactQuill from "react-quill-new";
       ^
GET /admin-users/ 500 in 1432ms
```

**根因**：

```
react-quill-new 在模块初始化时（import 语句执行时）访问了 document 或 window。
这类代码在 Node.js SSR 环境里没有这些全局变量，直接抛错。

以前 dynamic(ssr:false) 把整棵子树都关了 SSR，所以没触发。
移除后，Next.js 开始 SSR 所有 Client Components（包含 @repo/ui 的 FormRichTextField），
它静态 import 了 react-quill-new → 模块加载 → 崩溃。

注意：'use client' 不能解决这个问题！
Client Components 仍然会被 SSR（生成初始 HTML），只是不能用 hooks 的部分不运行。
真正的 import 语句在模块加载时就执行了，SSR 阶段同样会触发。
```

**修复方法**：在 `@repo/ui/src/form/FormRichTextField.tsx` 中将静态 import 改为 `useEffect` 懒加载：

```tsx
// ❌ 旧：静态 import，模块加载时立即执行，SSR 崩溃
import ReactQuill from "react-quill-new";

// ✅ 新：useEffect 懒加载，只在客户端执行
const [ReactQuill, setReactQuill] = useState<typeof ReactQuillType | null>(null);
useEffect(() => {
  import("react-quill-new").then((mod) => setReactQuill(() => mod.default));
}, []);
```

**为什么用 `useEffect` 而不是 `next/dynamic`**：
- `FormRichTextField` 在 `@repo/ui`（shared library），不应该依赖 Next.js 特有的 API
- `useEffect` 只在浏览器执行，是框架无关的标准模式
- `next/dynamic` 只能在 Next.js app 里用

**rebuild 触发热重载**：

```bash
# 修改 packages/ui 源码后必须 rebuild，容器通过 volume 自动拿到新 dist
node packages/ui/scripts/build.js

# 等 Next.js 重新编译（约 5-8 秒）
# 验证：HTTP 200 说明 SSR 不再崩溃
curl -sk https://admin-dev.joyminis.com/admin-users/ \
  -H "Cookie: auth_token=test" -o /dev/null -w "HTTP %{http_code}\n"
```

---

```bash
# 停容器 + 清除 build cache + 清除 node_modules + 重启（全量重装）
docker rm -f lucky-admin-next-dev
docker volume rm lucky_nest_monorepo_admin_next_build lucky_nest_monorepo_admin_next_nm
docker compose --env-file deploy/.env.dev up -d admin-next

# 查看启动日志
docker compose logs -f admin-next
```

> ⚠️ **注意**：这会删除 node_modules，重新安装需要约 2-3 分钟。  
> 如果只是想看最新日志排查问题，先用 `docker compose logs admin-next --tail=50`。

---

## 十二、下一阶段计划（Phase 1）

Phase 0 完成了基础设施迁移，所有页面仍然是 `'use client'`（CSR），功能上没有任何变化。

**Phase 1 目标：认证系统迁移**（预计 1 周）

```
改动点：
  1. 后端新增接口：POST /v1/admin/auth/set-cookie
     → 登录成功后设置 HTTP-only Cookie（浏览器 JS 无法读取）
     → Cookie 参数：HttpOnly, Secure, SameSite=Strict, 过期时间=JWT过期时间

  2. useAuthStore.login() 改为双写：
     localStorage.setItem('auth_token', token)  ← 保留（向下兼容）
     Set-Cookie 通过后端接口设置               ← 新增

  3. middleware.ts 已经写好了，会自动在生产生效（output: standalone 后）
     → 读 Cookie → 未登录跳 /login → 已登录访问 /login 跳 /

  4. DashboardLayout 去掉 dynamic(ssr:false)
     → 改为 Server Component
     → 服务端读 Cookie 验证 token
     → 完全消除加载闪烁（不再有 loading spinner）

预期收益：
  - 刷新 /users 直接看到内容（无 spinner）
  - token 存 HttpOnly Cookie（XSS 无法读取）
  - Middleware 服务端跳转（无客户端闪烁）
```

**参考阅读**：[SSR 升级完整分析 — Phase 1 认证系统迁移](./SSR_UPGRADE_ANALYSIS_CN.md#phase-1--认证系统迁移1-周)

---

*文档由开发团队维护，每个 Phase 完成后更新。如有疑问请查阅对应 git commit 记录。*

