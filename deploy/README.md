# Deploy 配置说明

## 目录结构

```
deploy/
├── .env.example      # 模板 (提交到 Git)
├── .env.dev          # 开发环境变量 (不提交)
├── .env.prod         # 生产环境变量 (不提交)
├── server-init.sh    # VPS 一次性初始化脚本
├── deploy.sh         # 本地构建 + 远程部署
├── rollback.sh       # 紧急回滚 (容器/数据库)
├── backup.sh         # 数据库备份 (VPS cron)
├── monitor.sh        # 轻量监控 (VPS cron)
└── renew-cert.sh     # SSL 证书自动续期 (VPS cron)
```

## 生产服务器

| 项目 | 值 |
|------|-----|
| IP | `***REDACTED***` |
| 位置 | San Jose, CA |
| OS | Ubuntu 22.04 |
| RAM | 1 GB |
| CPU | 1 Core |
| 路径 | `/opt/lucky` |

## 部署架构

```
方式 A: GitHub Actions (推荐, 自动)
┌───────────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  GitHub Actions       │     │  GHCR               │     │  VPS 1GB         │
│  构建 Docker 镜像      │ ──→ │  ghcr.io/…/backend  │ ──→ │  docker pull     │
│  构建 Admin 静态文件    │     │                     │     │  compose up      │
│                       │     └─────────────────────┘     └──────────────────┘
│  Wrangler deploy      │ ──→ Cloudflare Pages (admin.joyminis.com)
└───────────────────────┘

方式 B: 本地部署 (备用, 手动)
┌───────────────────────┐     ┌──────────────────┐
│  本地 Mac             │ SSH │  VPS 1GB         │
│  docker build + save  │ ──→ │  docker load     │
│  gzip 压缩传输        │     │  compose up      │
└───────────────────────┘     └──────────────────┘
```

> **为什么不在服务器上构建?**
> `yarn install` + `vite build` + `prisma generate` 需要 2GB+ 内存,
> 在 1GB 服务器上会 OOM Kill。

## CI/CD (GitHub Actions)

### 自动触发

| Workflow | 触发条件 (push main) | 目标 |
|----------|---------------------|------|
| `deploy-backend.yml` | `apps/api/**`, `packages/shared/**`, `Dockerfile.prod` | VPS (GHCR → docker pull) |
| `deploy-admin.yml` | `apps/mini-shop-admin/**`, `packages/shared/**`, `packages/ui/**` | Cloudflare Pages |
| `ci.yml` | PR + push main | Lint + 类型检查 + 测试 |

### 所需 GitHub Secrets

| Secret | 用途 | 示例 |
|--------|------|------|
| `SSH_HOST` | VPS IP | `***REDACTED***` |
| `SSH_USERNAME` | SSH 用户 | `root` |
| `SSH_PRIVATE_KEY` | Ed25519 私钥 | `ssh-keygen -t ed25519` 生成 |
| `VPS_GHCR_PAT` | GitHub PAT (read:packages) | 用于 VPS 拉取 GHCR 镜像 |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | Pages Edit 权限 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID | Dashboard → 概览 → 右侧 |

### SSH Key 设置

```bash
# 本地生成密钥对
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy_key

# 将公钥添加到 VPS
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@***REDACTED***

# 将私钥内容复制到 GitHub Secrets → SSH_PRIVATE_KEY
cat ~/.ssh/github_deploy_key
```

### Cloudflare Pages 设置

```bash
# 1. Cloudflare Dashboard → Pages → Create project → Direct Upload
# 2. 项目名: mini-shop-admin
# 3. 部署后: Settings → Custom Domains → 添加 admin.joyminis.com
# 4. DNS: admin.joyminis.com → CNAME → mini-shop-admin.pages.dev
```

## 快速上手

### 1. 首次配置

```bash
# 复制模板并填写实际值
cp deploy/.env.example deploy/.env.dev
cp deploy/.env.example deploy/.env.prod
# 编辑文件填入对应环境的密钥...
```

### 2. 首次部署 (一次性)

```bash
# A. 初始化 VPS
scp deploy/server-init.sh root@***REDACTED***:/root/
ssh root@***REDACTED*** 'chmod +x /root/server-init.sh && /root/server-init.sh'

# B. 配置 DNS A 记录 → ***REDACTED***
#    - admin.joyminis.com
#    - dev-api.joyminis.com
#    - dev.joyminis.com

# C. 申请 SSL 证书
ssh root@***REDACTED***
certbot certonly --standalone \
  -d admin.joyminis.com \
  -d dev-api.joyminis.com \
  -d dev.joyminis.com \
  --agree-tos -m your@email.com
cp /etc/letsencrypt/live/admin.joyminis.com/fullchain.pem /opt/lucky/certs/server.crt
cp /etc/letsencrypt/live/admin.joyminis.com/privkey.pem   /opt/lucky/certs/server.key

# D. 执行部署
./deploy/deploy.sh
```

### 3. 日常部署

```bash
# 全量部署 (构建两个镜像 + 传输 + 重启)
yarn deploy

# 仅更新后端
yarn deploy:backend

# 仅更新前端
yarn deploy:admin

# 跳过构建, 仅重启 (配置变更后)
yarn deploy:quick

# 仅同步配置文件 (不重启)
yarn deploy:sync

# 紧急回滚 (重启上一个可用容器)
yarn rollback
```

### 4. 开发环境

```bash
# 启动 (构建 base 镜像 + api + admin + nginx + db + redis)
yarn docker:up

# 查看日志
yarn docker:logs

# 停止
yarn docker:down
```

### 5. Prisma 命令 (在开发容器内执行)

```bash
yarn pr:m:dev       # 创建新迁移
yarn pr:m:deploy    # 部署迁移
yarn pr:m:status    # 查看迁移状态
yarn pr:m:reset     # 重置数据库
yarn pr:gen         # 重新生成 Prisma Client
yarn pr:studio      # 打开 Prisma Studio (端口 5555)
```

## VPS 运维

### 数据库备份

```bash
# 在 VPS 上安装 cron (每天凌晨 3 点备份)
scp deploy/backup.sh root@***REDACTED***:/opt/lucky/deploy/
ssh root@***REDACTED*** 'chmod +x /opt/lucky/deploy/backup.sh'
ssh root@***REDACTED*** '(crontab -l 2>/dev/null; echo "0 3 * * * /opt/lucky/deploy/backup.sh >> /var/log/lucky-backup.log 2>&1") | crontab -'

# 手动备份
ssh root@***REDACTED*** '/opt/lucky/deploy/backup.sh'

# 下载备份到本地
scp root@***REDACTED***:/opt/lucky/backups/backup_latest.dump.gz ./
```

### 监控

```bash
# 在 VPS 上安装 cron (每 5 分钟检查)
scp deploy/monitor.sh root@***REDACTED***:/opt/lucky/deploy/
ssh root@***REDACTED*** 'chmod +x /opt/lucky/deploy/monitor.sh'
ssh root@***REDACTED*** '(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/lucky/deploy/monitor.sh >> /var/log/lucky-monitor.log 2>&1") | crontab -'

# 查看监控日志
ssh root@***REDACTED*** 'tail -50 /var/log/lucky-monitor.log'

# 查看告警
ssh root@***REDACTED*** 'tail -20 /var/log/lucky-alerts.log'
```

### 紧急回滚

```bash
# 回滚后端 + 前端 (重启容器)
yarn rollback

# 仅回滚后端
yarn rollback:backend

# 恢复最近的数据库备份 (交互确认)
yarn rollback:db
```

### SSL 证书续期

```bash
# 在 VPS 上安装 cron (每周一凌晨 3 点自动续期)
scp deploy/renew-cert.sh root@***REDACTED***:/opt/lucky/deploy/
ssh root@***REDACTED*** 'chmod +x /opt/lucky/deploy/renew-cert.sh'
ssh root@***REDACTED*** '(crontab -l 2>/dev/null; echo "0 3 * * 1 /opt/lucky/deploy/renew-cert.sh >> /var/log/lucky-cert.log 2>&1") | crontab -'

# 手动续期
ssh root@***REDACTED*** '/opt/lucky/deploy/renew-cert.sh'

# 查看续期日志
ssh root@***REDACTED*** 'tail -20 /var/log/lucky-cert.log'
```

### 常用运维命令

```bash
# 查看日志
ssh root@***REDACTED*** 'cd /opt/lucky && docker compose -f compose.prod.yml logs -f --tail=100'

# 查看资源使用
ssh root@***REDACTED*** 'docker stats --no-stream'

# 重启某个服务
ssh root@***REDACTED*** 'cd /opt/lucky && docker compose -f compose.prod.yml restart backend'

# 进入容器调试
ssh root@***REDACTED*** 'docker exec -it lucky-backend-prod sh'

# 执行数据库迁移
ssh root@***REDACTED*** 'docker exec lucky-backend-prod ./apps/api/node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma'

# 清理 Docker 垃圾
ssh root@***REDACTED*** 'docker system prune -af --filter "until=72h"'

# 查看 swap 使用
ssh root@***REDACTED*** 'free -h && swapon --show'
```

## 内存预算 (1GB 服务器)

| 组件 | 限制 | 说明 |
|------|------|------|
| OS + Docker | ~130 MB | 系统底层 |
| Backend (Node.js) | ≤300 MB | `--max-old-space-size=256` |
| PostgreSQL | ≤200 MB | `shared_buffers=32MB, max_connections=30` |
| Redis | ≤150 MB | `maxmemory 128mb` |
| Nginx | ≤30 MB | 静态文件 + 反代 |
| **总计** | **~810 MB** | |
| Swap 兜底 | 1 GB | `vm.swappiness=10` |

## ENV 变量说明

所有环境变量集中在一个文件中，分为以下几组：

| 分组 | 变量前缀 | 用途 |
|------|----------|------|
| 基础设施 | `POSTGRES_*`, `REDIS_*` | Compose 插值 + 容器内连接 |
| API 连接 | `DATABASE_URL`, `REDIS_URL` | Prisma / Redis 客户端直连 |
| 安全 | `JWT_*`, `OTP_*` | 认证鉴权 |
| 存储 | `CF_R2_*`, `R2_*` | Cloudflare R2 文件上传 |
| 支付 | `XENDIT_*` | Xendit 支付网关 |
| 云服务 | `AWS_*`, `GOOGLE_*`, `FIREBASE_*` | KYC / 推送 / 地图 |
| 通信 | `TURN_*` | WebRTC TURN 服务器 |
