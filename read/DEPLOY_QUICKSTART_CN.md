# Cloudflare + VPS 部署快启（新人版）

> 目标：15 分钟看懂并能执行本项目当前线上部署方式。  
> 当前默认：`admin.joyminis.com` 在 Cloudflare，`api.joyminis.com` 在 VPS。

## 1. 先记住三件事

- Admin 前端：走 Cloudflare Workers（工作流：`.github/workflows/deploy-admin-cloudflare.yml`）。
- API 后端：走 VPS Docker（工作流：`.github/workflows/deploy-backend.yml`）。
- Nginx 生产配置已收敛为 API-only：`nginx/nginx.prod.conf` 只服务 `api.joyminis.com`。

## 2. 一图理解流量

- 浏览器访问 `https://admin.joyminis.com` -> Cloudflare Worker -> Next.js Admin。
- Admin 调用 API：`https://api.joyminis.com`。
- 实时通信：`wss://api.joyminis.com/socket.io/`。

## 3. 你最常用的命令

在仓库根目录执行：

```bash
yarn switch:admin:dns
yarn switch:admin:dns:execute
yarn rollback:admin:dns
yarn rollback:admin:dns:execute
yarn rollback:backend
yarn rollback:db
```

- `switch:*`：正向切流（默认 dry-run）。
- `rollback:admin:dns*`：把 Admin 域名回切到旧目标（默认 dry-run）。
- `rollback:backend`：后端容器回滚。

## 4. Cloudflare DNS 切流/回滚（必看）

切流脚本：`deploy/switch-admin-cloudflare.sh`  
回滚脚本：`deploy/cloudflare-rollback.sh`

两个脚本都遵循：

- 默认 dry-run，不改线上。
- 加 `--execute` 才生效。
- 都需要下面变量：

```bash
export CLOUDFLARE_API_TOKEN="<token>"
export CLOUDFLARE_ZONE_ID="<zone_id>"
export CLOUDFLARE_DNS_RECORD_ID="<record_id>"
```

正向切流额外变量：

```bash
export CF_SWITCH_TARGET="<target_host_or_ip>"
export CF_SWITCH_TYPE="CNAME" # 或 A
```

回滚额外变量：

```bash
export CF_ROLLBACK_TARGET="<target_host_or_ip>"
export CF_ROLLBACK_TYPE="CNAME" # 或 A
```

## 5. GitHub Actions 现在怎么工作

- `main` 分支：Admin Cloudflare 走 `production` 环境。
- `develop` 分支：Admin Cloudflare 走 `preview` 环境。
- Admin 部署会执行：`lint + check-types + test`，再 build+deploy。
- 部署后会记录：
  - Cloudflare deployment id
  - Cloudflare version id
  - 回退注记（artifact + summary）

## 6. 关键配置位置（改动必看）

- Admin Cloudflare 工作流：`.github/workflows/deploy-admin-cloudflare.yml`
- 后端部署工作流：`.github/workflows/deploy-backend.yml`
- 总控开关：`.github/workflows/deploy-master.yml`
- Next 构建目标开关：`apps/admin-next/next.config.ts`
- API CORS 白名单：`apps/api/src/main.ts`
- 生产 Nginx：`nginx/nginx.prod.conf`

## 7. 发布后最小验收

```bash
curl -I https://admin.joyminis.com
curl -sS https://api.joyminis.com/api/v1/health
```

如果 Admin 异常，先看最近一次 `deploy-admin-cloudflare` 的 Summary/Artifact，再执行：

```bash
yarn rollback:admin:dns
yarn rollback:admin:dns:execute
```

## 8. 新人阅读顺序（最省时间）

1. 本文：`read/DEPLOY_QUICKSTART_CN.md`
2. 细节手册：`RUNBOOK.md`
3. 架构全景：`ARCHITECTURE_CN.md`

