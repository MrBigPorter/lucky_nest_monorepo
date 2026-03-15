# 🏢 Lucky Nest — 运维操作手册 (Runbook)

> **适用环境**: 本地开发 (macOS) · 生产服务器 (VPS Ubuntu 22.04) · CI/CD (GitHub Actions)
> **最后更新**: 2026-03-15

---

## 📋 目录

1. [环境概览](#1-环境概览)
2. [本地开发环境 — 首次搭建](#2-本地开发环境--首次搭建)
3. [本地开发 — 日常工作流](#3-本地开发--日常工作流)
4. [数据库操作](#4-数据库操作)
5. [生产环境 — 首次部署 (全新服务器)](#5-生产环境--首次部署-全新服务器)
6. [生产环境 — 日常发布](#6-生产环境--日常发布)
7. [超级管理员管理](#7-超级管理员管理)
8. [前端 (Admin) 发布](#8-前端-admin-发布)
9. [回滚操作](#9-回滚操作)
10. [常见问题排查](#10-常见问题排查)

---

## 1. 环境概览

```
┌─────────────────────────────────────────────────────┐
│                   Lucky Nest 架构                    │
├──────────────┬──────────────┬───────────────────────┤
│   本地开发    │   CI/CD      │      生产环境           │
│   (macOS)    │  (GitHub)    │  (VPS ***REDACTED***) │
├──────────────┼──────────────┼───────────────────────┤
│ Docker Dev   │ Build image  │ lucky-backend-prod     │
│ NestJS Watch │ Push → GHCR  │ lucky-db-prod          │
│ Vite HMR     │ SSH Deploy   │ lucky-redis-prod        │
│              │ CF Pages     │ lucky-nginx-prod        │
└──────────────┴──────────────┴───────────────────────┘

前端:  https://admin.joyminis.com  (Cloudflare Pages)
API:   https://api.joyminis.com    (VPS + Nginx)
镜像:  ghcr.io/mrbigporter/lucky-backend-prod
```

### 关键文件速查

| 文件 | 用途 |
|------|------|
| `deploy/.env.dev` | 本地开发环境变量 (gitignore) |
| `deploy/.env.prod` | 生产环境变量 (gitignore) |
| `deploy/.env.example` | 环境变量模板 |
| `compose.yml` | 本地 Docker Compose |
| `compose.prod.yml` | 生产 Docker Compose |
| `deploy/deploy.sh` | 本地构建 + 手动部署脚本 |
| `deploy/init-db.sh` | 生产数据库首次初始化 |
| `deploy/baseline-db.sh` | P3005 错误时数据库基线化 |
| `Dockerfile.prod` | 生产镜像构建文件 |
| `.github/workflows/deploy-backend.yml` | 后端 CI/CD |
| `.github/workflows/deploy-admin.yml` | 前端 CI/CD |

---

## 2. 本地开发环境 — 首次搭建

### 前置条件

```bash
# 检查工具版本
node -v        # >= 20.x
docker -v      # >= 24.x
yarn -v        # >= 4.x (corepack)
git -v
```

### Step 1 — 克隆仓库

```bash
git clone https://github.com/mrbigporter/lucky_nest_monorepo.git
cd lucky_nest_monorepo
```

### Step 2 — 安装依赖

```bash
# 启用 corepack (yarn 4)
corepack enable

# 安装所有 workspace 依赖
yarn install
```

### Step 3 — 创建本地环境变量

```bash
# 从模板复制
cp deploy/.env.example deploy/.env.dev

# 编辑开发配置 (以下字段必须填写)
vim deploy/.env.dev
```

**最低必填字段：**

```dotenv
NODE_ENV=development
POSTGRES_USER=dev
POSTGRES_PASSWORD=dev123
POSTGRES_DB=lucky_dev
REDIS_PASSWORD=redis123

DATABASE_URL=postgresql://dev:dev123@db:5432/lucky_dev?schema=public
REDIS_URL=redis://:redis123@redis:6379/0

JWT_SECRET=local_dev_secret_change_me
OTP_DEV_CODE=999999          # 开发用万能验证码，跳过真实短信

# 以下可暂时留 change_me，不影响基础功能启动
CF_R2_ACCOUNT_ID=change_me
XENDIT_SECRET_KEY=change_me
```

### Step 4 — 启动本地 Docker 服务

```bash
# 启动所有服务 (DB + Redis + API + Nginx)
yarn docker:up

# 查看日志
yarn docker:logs

# 仅查看 API 日志
docker logs -f lucky-backend-dev
```

### Step 5 — 初始化数据库 (首次)

```bash
# 进入 API 容器执行迁移
docker exec lucky-backend-dev \
  yarn workspace @lucky/api pr:dev

# 写入初始 Seed 数据
docker exec lucky-backend-dev \
  yarn workspace @lucky/api seed
```

### Step 6 — 创建本地超级管理员

```bash
# 交互式创建 (推荐)
yarn workspace @lucky/api create-admin
```

### Step 7 — 启动前端 (独立终端)

```bash
# Admin 前端 (Vite dev server)
yarn dev:admin
# 访问: http://localhost:5173
```

### ✅ 验证本地环境

```bash
# API 健康检查
curl http://localhost:3000/api/v1/health

# 前端访问
open http://localhost:5173
```

---

## 3. 本地开发 — 日常工作流

### 启动 / 停止

```bash
yarn docker:up          # 启动后端服务
yarn dev:admin          # 启动前端 (新终端)

yarn docker:down        # 停止所有容器
```

### 常用命令速查

```bash
# ── 数据库 ──
yarn workspace @lucky/api pr:dev          # 创建新迁移
yarn workspace @lucky/api pr:deploy       # 应用迁移
yarn workspace @lucky/api seed            # 重置 Seed 数据

# ── 代码生成 ──
yarn gen:shop:api                         # 生成错误码 (后端)
yarn gen:shop:client                      # 生成错误码 (前端)

# ── 代码检查 ──
yarn lint                                 # 全项目 lint
yarn check-types                          # TypeScript 类型检查

# ── 构建 ──
yarn build                                # 全量构建
yarn build:admin                          # 仅前端
```

### 新功能开发流程

```
1. git checkout -b feature/xxx
2. 开发代码
3. (如有数据库变更) yarn workspace @lucky/api pr:dev
4. yarn lint && yarn check-types
5. git push → 自动触发 CI 检查
6. PR → Code Review → Merge to main → 自动触发 CI 部署
```

---

## 4. 数据库操作

### 4.1 创建新迁移 (开发环境)

```bash
# 在本地容器内运行
docker exec -it lucky-backend-dev bash

# 修改 schema.prisma 后执行
yarn workspace @lucky/api pr:dev
# 按提示输入迁移名称，如: add_user_kyc_status
```

> ⚠️ **注意**: `migrate dev` 只在开发环境用，生产永远用 `migrate deploy`

### 4.2 迁移文件管理规范

```
prisma/migrations/
  20240315120000_add_user_kyc/
    migration.sql        ← 自动生成，禁止手动修改
  20240316090000_add_coupon_table/
    migration.sql
```

**命名规范**: `YYYYMMDDHHMMSS_动词_对象`

示例:
- `add_admin_users`
- `update_treasure_status`
- `drop_legacy_orders`

### 4.3 生产迁移流程

```bash
# CI 自动执行 (推送 main 分支触发)
# 若需手动执行，在服务器上:

cd /opt/lucky
NETWORK=$(docker inspect lucky-db-prod \
  --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' \
  | awk '{print $1}')

docker run --rm \
  --network "$NETWORK" \
  --env-file deploy/.env.prod \
  --entrypoint "" \
  lucky-backend-prod:latest \
  ./apps/api/node_modules/.bin/prisma migrate deploy \
    --schema=apps/api/prisma/schema.prisma
```

### 4.4 查看迁移状态

```bash
# 本地
docker exec lucky-backend-dev \
  yarn workspace @lucky/api pr:val

# 生产
docker run --rm \
  --network lucky_app \
  --env-file /opt/lucky/deploy/.env.prod \
  --entrypoint "" \
  lucky-backend-prod:latest \
  ./apps/api/node_modules/.bin/prisma migrate status \
    --schema=apps/api/prisma/schema.prisma
```

### 4.5 数据库基线化 (P3005 错误时)

> 场景: 数据库已有表但没有迁移历史记录

```bash
# 在服务器上执行 (仅一次)
cd /opt/lucky
bash deploy/baseline-db.sh
```

### 4.6 Seed 数据

```bash
# 本地 — 全量 Seed
yarn workspace @lucky/api seed

# 本地 — 仅宝藏数据
yarn workspace @lucky/api seed:treasures

# 生产 — 通过 init-db.sh 执行 (首次)
# ⚠️  生产 Seed 只在首次初始化时运行，之后不重复执行
```

---

## 5. 生产环境 — 首次部署 (全新服务器)

> 此流程只需执行一次，全新服务器从零到运行。

### 前置条件

- [ ] 服务器已安装 Docker 和 Docker Compose
- [ ] 本地 SSH 可以免密登录服务器
- [ ] GitHub Secrets 已配置完毕 (见下方)
- [ ] `deploy/.env.prod` 已填写所有真实值

### Step 1 — 配置 GitHub Secrets

在 GitHub → Settings → Secrets and variables → Actions 中添加：

| Secret 名称 | 说明 |
|-------------|------|
| `SSH_HOST` | 服务器 IP: `***REDACTED***` |
| `SSH_USERNAME` | 登录用户: `root` |
| `SSH_PRIVATE_KEY` | SSH 私钥内容 |
| `VPS_GHCR_PAT` | GitHub PAT (read:packages 权限) |
| `TELEGRAM_TOKEN` | Telegram Bot Token |
| `TELEGRAM_CHAT_ID` | Telegram 接收通知的 Chat ID |
| `CF_ACCOUNT_ID` | Cloudflare Account ID |
| `CF_API_TOKEN` | Cloudflare API Token |

### Step 2 — 服务器初始化

```bash
# SSH 登录服务器
ssh root@***REDACTED***

# 创建项目目录结构
mkdir -p /opt/lucky/{deploy,nginx/html,redis,certs,data}

# 安装 Docker (如未安装)
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker
```

### Step 3 — 同步配置文件 (本地 Mac 执行)

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo

# 同步所有配置到服务器
./deploy/deploy.sh --sync
```

此命令会同步:
- `compose.prod.yml`
- `deploy/.env.prod`
- `deploy/init-db.sh`
- `deploy/baseline-db.sh`
- `nginx/nginx.prod.conf`
- `nginx/whitelist.conf`
- `redis/redis.conf`

### Step 4 — 构建并传输后端镜像

```bash
# 本地 Mac: 构建 + 传输 (约 5-10 分钟)
./deploy/deploy.sh --backend
```

### Step 5 — 初始化数据库 (服务器执行)

```bash
ssh root@***REDACTED***
cd /opt/lucky

# 执行数据库初始化 (迁移 + Seed)
bash deploy/init-db.sh

# 如果出现 P3005 错误，先执行基线化:
# bash deploy/baseline-db.sh
# 然后再执行:
# bash deploy/init-db.sh --migrate-only
```

### Step 6 — 创建超级管理员

```bash
# 在服务器上 (服务已启动后)
docker exec -it lucky-backend-prod \
  node apps/api/dist/cli/create-admin.js
```

按提示输入：
```
用户名 (Username): admin
显示名称 (Real name): 管理员
密码 (Password):          ████████
确认密码 (Confirm):       ████████
```

### Step 7 — 验证服务

```bash
# 健康检查
curl https://api.joyminis.com/api/v1/health

# 查看所有容器状态
docker compose -f compose.prod.yml ps

# 查看后端日志
docker logs -f lucky-backend-prod --tail=50
```

### ✅ 首次部署检查清单

```
[ ] docker compose ps 显示所有容器 healthy
[ ] curl /api/v1/health 返回 200
[ ] 能用管理员账号登录 admin.joyminis.com
[ ] 后端日志无 ERROR 级别报错
[ ] 收到 Telegram 部署成功通知
```

---

## 6. 生产环境 — 日常发布

### 方式一：CI/CD 自动发布 (推荐)

```
推送代码到 main 分支
        ↓
GitHub Actions 自动触发
        ↓
┌───────────────────┬──────────────────────┐
│   后端变更         │   前端变更             │
│ deploy-backend.yml│ deploy-admin.yml      │
├───────────────────┼──────────────────────┤
│ 1. Build image    │ 1. yarn install       │
│ 2. Push to GHCR   │ 2. yarn build:admin   │
│ 3. Pull on VPS    │ 3. CF Pages deploy    │
│ 4. Run migration  │ 4. Telegram notify    │
│ 5. Restart        │                       │
│ 6. Health check   │                       │
│ 7. Auto rollback  │                       │
│ 8. Telegram notify│                       │
└───────────────────┴──────────────────────┘
```

**触发规则:**

| 变更路径 | 触发的 workflow |
|----------|----------------|
| `apps/api/**` | deploy-backend |
| `packages/shared/**` | deploy-backend + deploy-admin |
| `apps/mini-shop-admin/**` | deploy-admin |
| `Dockerfile.prod` | deploy-backend |

### 方式二：本地手动发布

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo

./deploy/deploy.sh              # 全量 (前端 + 后端)
./deploy/deploy.sh --backend    # 仅后端
./deploy/deploy.sh --admin      # 仅前端 (走本地 Nginx，非 CF)
./deploy/deploy.sh --quick      # 跳过构建，仅重启服务
./deploy/deploy.sh --sync       # 仅同步配置文件
```

### 方式三：手动触发 CI (GitHub UI)

```
GitHub → Actions → 🚀 Master Deployment Control
→ Run workflow
→ 勾选需要部署的模块 (Admin / API)
→ Run
```

### 发布前检查清单

```bash
# 1. 确保本地代码已 push 且 CI lint/type-check 通过
git status
git log --oneline -5

# 2. 确认没有未完成的 migration
yarn workspace @lucky/api pr:val

# 3. 本地构建测试
yarn build

# 4. 检查 .env.prod 配置是否有 change_me 未替换
grep "change_me" deploy/.env.prod
```

---

## 7. 超级管理员管理

### 创建 / 重置密码 (推荐方式)

```bash
# 生产环境 (容器运行中直接执行，密码不经过任何文件)
docker exec -it lucky-backend-prod \
  node apps/api/dist/cli/create-admin.js

# 本地开发 — 方式一：宿主机直接运行 (自动加载 deploy/.env.dev)
yarn workspace @lucky/api create-admin

# 本地开发 — 方式二：在容器内运行 (适合 DATABASE_URL 有问题时)
docker exec -it lucky-backend-dev \
  yarn workspace @lucky/api create-admin
```

> **原理**: 宿主机运行时脚本会自动找到 `deploy/.env.dev`，并将
> `@db:5432` 替换为 `@localhost:5432`（Docker 端口已映射到宿主机）

交互流程：
```
🔑  Lucky Admin — 超级管理员创建工具
=========================================
用户名 (Username): admin
显示名称 (Real name, 回车跳过): Kevin
密码 (Password):          ████████    ← 不回显
确认密码 (Confirm):       ████████    ← 不回显

✅ 管理员账号已创建！
  ID       : clxxxxxxxxxxx
  用户名   : admin
  角色     : super_admin
  状态     : 启用
```

> **安全原则**: 密码只在终端交互时存在，不写入任何文件、日志、环境变量

### 创建其他管理员

登录后台 `admin.joyminis.com` → 用户管理 → 新建管理员

### 禁用管理员账号

```bash
# 直接操作数据库 (紧急情况)
docker exec -it lucky-db-prod psql -U lucky_prod -d lucky_prod -c \
  "UPDATE admin_users SET status=0 WHERE username='xxx';"
```

---

## 8. 前端 (Admin) 发布

### 自动发布 (推荐)

推送 `apps/mini-shop-admin/` 下的代码到 `main` 分支，GitHub Actions 自动构建并部署到 Cloudflare Pages。

### 手动发布

```bash
# 本地构建
yarn build:admin
# 产物在: apps/mini-shop-admin/dist/

# 手动部署到 Cloudflare (需要 wrangler)
npx wrangler pages deploy apps/mini-shop-admin/dist \
  --project-name=mini-shop-admin \
  --commit-dirty=true
```

### 前端环境变量

| 文件 | 用途 |
|------|------|
| `apps/mini-shop-admin/.env` | 通用默认 |
| `apps/mini-shop-admin/.env.development` | `yarn dev` 时生效 |
| `apps/mini-shop-admin/.env.production` | `yarn build` 时生效 |

```dotenv
# .env.production
VITE_API_BASE_URL=https://api.joyminis.com
VITE_ENV=production
```

---

## 9. 回滚操作

### 后端快速回滚

CI 部署失败时会自动回滚。若需手动回滚：

```bash
ssh root@***REDACTED***
cd /opt/lucky

# 查看可用的旧镜像
docker images | grep lucky-backend

# 用旧镜像重启
BACKEND_IMAGE="ghcr.io/mrbigporter/lucky-backend-prod:<旧SHA>" \
  docker compose -f compose.prod.yml --env-file deploy/.env.prod \
  up -d --no-build --force-recreate backend

# 验证
docker logs -f lucky-backend-prod --tail=20
```

### 数据库迁移回滚

> ⚠️ Prisma migrate 没有内置回滚，需手动处理

```bash
# 1. 查看最近的迁移
docker exec lucky-db-prod psql -U lucky_prod -d lucky_prod -c \
  "SELECT migration_name, applied_steps_count FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"

# 2. 手动执行 down SQL (如果迁移文件有对应的回滚 SQL)
# 3. 标记为已回滚
docker run --rm --network lucky_app \
  --env-file /opt/lucky/deploy/.env.prod \
  --entrypoint "" \
  lucky-backend-prod:latest \
  ./apps/api/node_modules/.bin/prisma migrate resolve \
    --rolled-back "20240315_migration_name" \
    --schema=apps/api/prisma/schema.prisma
```

### 前端回滚

Cloudflare Pages 控制台 → mini-shop-admin → Deployments → 选择历史版本 → Rollback

---

## 10. 常见问题排查

### P3005 — 数据库已有表但无迁移历史

```bash
# 症状: Error: P3005 The database schema is not empty
# 解决:
bash deploy/baseline-db.sh
```

### P1001 — 无法连接数据库

```bash
# 检查 DB 容器状态
docker ps | grep db
docker logs lucky-db-prod --tail=20

# 检查 DATABASE_URL
grep DATABASE_URL deploy/.env.prod

# 重启 DB
docker compose -f compose.prod.yml --env-file deploy/.env.prod restart db
```

### 后端启动报 JWT_SECRET / REDIS_URL 缺失

```bash
# 检查 env 文件是否同步到服务器
ssh root@***REDACTED*** "grep JWT_SECRET /opt/lucky/deploy/.env.prod"

# 重新同步
./deploy/deploy.sh --sync
```

### 迁移命令意外启动了 NestJS

```bash
# 症状: → Start Nest 出现在迁移日志中
# 原因: docker run 没有加 --entrypoint ""
# 解决: 所有 prisma 命令的 docker run 都要加 --entrypoint ""
```

### fast-check 模块找不到 (P3005 变种)

```bash
# 症状: Cannot find module 'fast-check'
# 原因: Dockerfile.prod Pruner 删了 fast-check，但 @prisma/config 需要它
# 解决: 重新构建镜像 (已在 Dockerfile.prod 中修复)
./deploy/deploy.sh --backend
```

### 前端 Cloudflare Project Not Found

```bash
# 症状: Project not found [code: 8000007]
# 解决: 在 Cloudflare Dashboard 手动创建名为 mini-shop-admin 的 Pages 项目
# https://dash.cloudflare.com → Pages → Create a project → Direct Upload
```

### 健康检查超时 → 自动回滚

```bash
# 查看容器启动日志排查原因
docker logs lucky-backend-prod --tail=100

# 常见原因:
# 1. 环境变量缺失 → 检查 .env.prod
# 2. DB 连接失败 → 检查 DATABASE_URL
# 3. 端口冲突 → docker ps 查看端口占用
# 4. OOM → free -h 查看内存
```

---

## 附录：关键命令速查卡

```bash
# ═══ 本地开发 ═══════════════════════════════════════
yarn docker:up                              # 启动开发环境
yarn docker:down                            # 停止开发环境
yarn docker:logs                            # 查看日志
yarn dev:admin                              # 启动前端
yarn workspace @lucky/api create-admin      # 创建管理员 (本地)

# ═══ 数据库 ═════════════════════════════════════════
yarn workspace @lucky/api pr:dev            # 创建迁移 (本地)
yarn workspace @lucky/api seed              # 写入 Seed

# ═══ 生产部署 ════════════════════════════════════════
./deploy/deploy.sh                          # 全量部署 (本地)
./deploy/deploy.sh --backend                # 仅后端
./deploy/deploy.sh --sync                   # 仅同步配置

# ═══ 生产数据库 ══════════════════════════════════════
bash deploy/init-db.sh                      # 首次初始化 (服务器)
bash deploy/baseline-db.sh                  # P3005 基线化 (服务器)

# ═══ 生产管理员 ══════════════════════════════════════
docker exec -it lucky-backend-prod \
  node apps/api/dist/cli/create-admin.js    # 创建管理员 (服务器)

# ═══ 监控 ════════════════════════════════════════════
docker compose -f compose.prod.yml ps       # 容器状态 (服务器)
docker logs -f lucky-backend-prod           # 后端日志 (服务器)
free -h                                     # 内存状态 (服务器)
```

