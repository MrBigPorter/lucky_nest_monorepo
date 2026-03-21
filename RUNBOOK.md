# Lucky Nest 发布与运维手册

> 目标：**看得懂、能直接复制命令执行、出问题先知道看哪里**。
>
> 最后更新：2026-03-21

---

## 0. 先记住这几件事

| 项目         | 值                                       |
| ------------ | ---------------------------------------- |
| 后端健康检查 | `https://api.joyminis.com/api/v1/health` |
| Admin 入口   | `https://admin.joyminis.com`             |
| VPS          | `root@107.175.53.104` → `/opt/lucky`     |
| 后端容器     | `lucky-backend-prod`                     |
| Nginx 容器   | `lucky-nginx-prod`                       |
| 数据库容器   | `lucky-db-prod`                          |
| Redis 容器   | `lucky-redis-prod`                       |

### 0.1 30 秒故障判断

| 现象                         | 先看                                  |
| ---------------------------- | ------------------------------------- |
| API 不通                     | → `5.1 最小验收` + `8.2 健康检查失败` |
| Admin 打开但登录接口地址错了 | → `5.2 API 路径少了 /api`             |
| 容器状态不对                 | → `4.1 查看服务状态` + `1.2 日志`     |
| 新版本部署后出问题           | → `6.1 后端回滚`（不要手改线上！）    |
| 功能正常但新模型不存在       | → `8.4 生产 Prisma 落后`              |
| VPS 内存告急                 | → `4.6 资源检查`                      |

---

## 1. 命令速查（复制即用）

### 1.1 本地发布（Mac 执行）

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo

yarn deploy            # 全量（后端 + Admin fallback）
yarn deploy:backend    # 仅后端
yarn deploy:admin      # 仅 Admin VPS fallback
yarn deploy:sync       # 仅同步配置文件（不重建镜像）
yarn deploy:quick      # 跳过构建，只重启服务

yarn rollback:backend  # 后端回滚
yarn rollback:db       # 数据库回滚（高风险）
```

### 1.2 服务器日志（SSH 后执行）

```bash
ssh root@107.175.53.104
cd /opt/lucky

docker compose -f compose.prod.yml --env-file deploy/.env.prod ps
docker logs --tail=200 lucky-backend-prod
docker logs --tail=200 lucky-nginx-prod
docker logs --tail=200 lucky-db-prod
docker logs --tail=200 lucky-redis-prod
```

---

## 2. 完整发布链路（一图看懂）

```
本地开发
  │
  ├─ [schema 变更] → prisma migrate dev → 迁移文件一起提交
  ├─ [packages/shared 变更] → node packages/shared/scripts/build.js
  ├─ [packages/ui 变更]     → node packages/ui/scripts/build.js
  │
  ▼
提交 → pre-commit（lint:staged）
  │
  ▼
推到远端 → 开 PR (目标 main)
  │
  ▼
CI 自动跑（ci.yml）— 硬门禁必须全过
  ├─ prisma generate
  ├─ turbo check-types      ← 硬门禁
  ├─ admin-next 单测        ← 硬门禁
  ├─ turbo lint              ← 软门禁（失败不阻断）
  └─ Playwright E2E          ← 软门禁（失败不阻断）
  │
  ▼
PR 合并到 main
  │
  ├─── apps/api/** 有变动 ─────────────────────────────────┐
  │                                                       ▼
  │                                         deploy-backend.yml
  │                                           ① docker build → 推 GHCR 镜像
  │                                           ② SSH 到 VPS：
  │                                               docker pull 新镜像
  │                                               临时容器跑 prisma migrate deploy
  │                                               force-recreate 重启后端容器
  │                                               健康检查（最多等 90s）
  │                                               失败 → 自动回滚旧镜像
  │                                           ③ Telegram 战报
  │
  └─── apps/admin-next/** 有变动 ─────────────────────────┐
                                                          ▼
                                        deploy-admin-cloudflare.yml
                                          ① quality（lint+types+单测，全硬门禁）
                                          ② build（注入 NEXT_PUBLIC_* 环境变量）
                                          ③ opennextjs-cloudflare deploy
                                          ④ Smoke Check
                                          ⑤ Telegram 战报
```

### 2.1 什么是自动的，什么需要手动

| 操作                   | 自动/手动 | 触发条件                                  |
| ---------------------- | --------- | ----------------------------------------- |
| DB 迁移                | ✅ 自动   | 后端部署时，临时容器自动跑 migrate deploy |
| Prisma Client 更新     | ✅ 自动   | 后端镜像构建时 prisma generate 已打进镜像 |
| Admin 部署             | ✅ 自动   | admin-next 路径有改动并合并到 main        |
| 后端部署               | ✅ 自动   | apps/api 路径有改动并合并到 main          |
| Seed 数据              | ❌ 手动   | 只在首次上线时手动跑一次                  |
| 创建管理员             | ❌ 手动   | 按需手动                                  |
| TURN 服务器            | ❌ 手动   | VPS 重置后手动恢复                        |
| 纯配置变更（不改代码） | ❌ 手动   | `yarn deploy:sync` + `yarn deploy:quick`  |

> ⚠️ **关键**：只改 `deploy/.env.prod` 不会触发后端重建，需要手动 `yarn deploy:sync` + `yarn deploy:quick`。

---

## 3. 生产首发（第一次上线时做）

### 3.1 初始化 VPS

```bash
scp deploy/server-init.sh root@107.175.53.104:/root/
ssh root@107.175.53.104 'chmod +x /root/server-init.sh && /root/server-init.sh'
```

### 3.2 首次部署

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn deploy
```

### 3.3 首次 seed（只执行一次）

```bash
# 推荐：先停后端，避免与线上流量争抢数据库连接
docker compose -f compose.prod.yml --env-file deploy/.env.prod stop backend

# 可显式限制 seed 连接池，进一步降低连接峰值
SEED_DB_CONNECTION_LIMIT=1 SEED_DB_POOL_TIMEOUT=60 \
  docker exec -it lucky-backend-prod node /app/apps/api/dist/cli/seed/run-seed.js

# seed 完成后恢复后端
docker compose -f compose.prod.yml --env-file deploy/.env.prod up -d --no-build backend
```

> ❌ 不要在容器里用 `yarn workspace @lucky/api seed`  
> 原因：容器里没有 monorepo workspace 根目录，会报 `Cannot find the root of your workspace`

### 3.4 创建 / 重置管理员密码

```bash
docker exec -it lucky-backend-prod node /app/apps/api/dist/cli/cli/create-admin.js
```

---

## 4. 服务器常用操作

### 4.1 查看服务状态

```bash
cd /opt/lucky
docker compose -f compose.prod.yml --env-file deploy/.env.prod ps
```

### 4.2 重启单个服务

```bash
cd /opt/lucky
# 后端
docker compose -f compose.prod.yml --env-file deploy/.env.prod \
  up -d --no-build --force-recreate backend
# Nginx
docker compose -f compose.prod.yml --env-file deploy/.env.prod \
  up -d --no-build --force-recreate --no-deps nginx
```

### 4.3 Prisma 迁移诊断（判断生产是否落后）

```bash
# ① 查看生产数据库已跑的迁移（最近 10 条）
ssh root@107.175.53.104 'docker exec lucky-backend-prod \
  node -e "
const { PrismaClient } = require(\"/app/apps/api/node_modules/@prisma/client\");
const p = new PrismaClient();
p.\$queryRaw\`SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10\`
  .then(r => r.forEach(m => console.log(m.finished_at, m.migration_name)))
  .finally(() => p.\$disconnect())
"'

# ② 查看生产 Prisma Client 已注册的模型（对比本地 schema 有无缺漏）
ssh root@107.175.53.104 'docker exec lucky-backend-prod \
  node -e "
const { PrismaClient } = require(\"/app/apps/api/node_modules/@prisma/client\");
const p = new PrismaClient();
console.log(Object.keys(p).filter(k => !k.startsWith(\"_\") && !k.startsWith(\"\$\")));
"'

# ③ 手动补跑迁移（仅当诊断出落后时）
docker exec -it lucky-backend-prod sh -lc \
  "./node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma"
```

> 正常发布流程里，迁移由**临时容器**自动跑，不依赖后端容器 entrypoint。  
> 只有 deploy workflow 没成功执行到这一步时，才需要手动补。

### 4.4 只读进入数据库

```bash
docker exec -it lucky-db-prod sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

### 4.5 恢复 TURN 服务器（视频/语音通话，VPS 重置后才需要）

```bash
ssh root@107.175.53.104
cd /opt/lucky

export TURN_SECRET="与 .env.prod 里相同的 TURN_SECRET"
export TURN_PUBLIC_IP="111.111.11.111"
export TURN_DOMAIN="turn.joyminis.com"   # 如无域名可填 IP

bash deploy/install-turn.sh
```

> ⚠️ **Cloudflare DNS 注意**：`turn.joyminis.com` 的 A 记录必须设为 **⬜ 灰云（DNS only）**，  
> 绝不能走橙云代理——Cloudflare 不转发 UDP 3478，TURN 会完全失效。

安装完更新 `.env.prod`：

```dotenv
TURN_SECRET=<同上>
TURN_URL=turn:turn.joyminis.com:3478?transport=udp
```

重启后端：

```bash
docker compose -f compose.prod.yml --env-file deploy/.env.prod \
  up -d --no-build --force-recreate backend
```

验证：

```bash
ss -lntup | grep 3478
tail -n 100 /var/log/turnserver.log
```

### 4.6 资源检查（内存 / 容器占用）

```bash
ssh root@107.175.53.104 'free -h && echo "---" && \
  docker stats --no-stream --format \
    "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.CPUPerc}}"'
```

> VPS 总 RAM 1 GB，各容器当前限额：backend 300 MB / postgres 200 MB / redis 150 MB / nginx 30 MB。  
> `available` < 150 MB 或 Swap 超过 500 MB 时需关注。

---

## 5. 发布后验证

### 5.1 最小验收（每次发布后必做）

```bash
# API 健康
curl -sS https://api.joyminis.com/api/v1/health

# 容器状态
ssh root@107.175.53.104 \
  'cd /opt/lucky && docker compose -f compose.prod.yml ps'

# 后端日志（有无 ERROR）
ssh root@107.175.53.104 \
  'docker logs --tail=100 lucky-backend-prod'
```

再手动确认：

- `https://admin.joyminis.com` 可以打开
- 登录后台正常
- 至少点开一个后台列表页

### 5.2 如果看到 API 请求少了 `/api`

错误示例：`https://api.joyminis.com/v1/auth/admin/login`  
正确格式：`https://api.joyminis.com/api/v1/auth/admin/login`

排查：

1. 检查 GitHub Environment Secret：`NEXT_PUBLIC_API_BASE_URL`
2. 必须是：`https://api.joyminis.com/api`（结尾**没有**斜杠，**有** `/api`）
3. 改完后**必须重新部署 Admin**（`NEXT_PUBLIC_*` 是构建时注入，不重建不生效）

### 5.3 登录 `ERR_NETWORK`：Nginx / CORS 配置基线

适用现象：浏览器里登录请求 `POST /api/v1/auth/admin/login` 显示 `200`，但 Axios 仍报 `ERR_NETWORK`。

生产基线：`nginx/nginx.prod.conf` 的 `location /api/` **不再添加任何 CORS 头**，
由后端 `apps/api/src/main.ts` 的 `app.enableCors(...)` 统一输出 CORS。

```nginx
# 通用 API (含上传超时 + 限流)
# CORS 完全由 NestJS (main.ts enableCors) 处理，Nginx 不添加任何 CORS 头，
# 避免双重 CORS 头冲突（浏览器会拒绝同时包含 * 和具体域名的响应）。
location /api/ {
    limit_req zone=api_limit burst=50 nodelay;

    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;

    proxy_pass http://backend:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

应用配置：

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn deploy:sync
ssh root@107.175.53.104 'cd /opt/lucky && docker compose -f compose.prod.yml --env-file deploy/.env.prod up -d --no-build --force-recreate --no-deps nginx'
```

验证（必须看到**单一**来源，且不是 `*`）：

```bash
curl -s -I -X OPTIONS https://api.joyminis.com/api/v1/auth/admin/login \
  -H "Origin: https://admin.joyminis.com" \
  -H "Access-Control-Request-Method: POST" | grep -i "access-control"
```

同时确认后端环境变量：`/opt/lucky/deploy/.env.prod` 里有：

```dotenv
CORS_ORIGIN=https://admin.joyminis.com
```

---

## 6. 回滚

### 6.1 后端回滚

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn rollback:backend
```

> CI 健康检查失败时已**自动回滚**，这是手动兜底。

### 6.2 数据库回滚（高风险，最后手段）

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn rollback:db
```

> 这会覆盖当前数据库数据，**只在明确数据事故**时执行。

### 6.3 Admin Cloudflare DNS 回滚

先 dry-run 确认：

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
export CLOUDFLARE_API_TOKEN="<token>"
export CLOUDFLARE_ZONE_ID="<zone_id>"
export CLOUDFLARE_DNS_RECORD_ID="<record_id>"
export CF_ROLLBACK_TARGET="<target_host_or_ip>"
export CF_ROLLBACK_TYPE="CNAME"   # 或 A
yarn rollback:admin:dns
```

确认输出正确后再执行：

```bash
yarn rollback:admin:dns:execute
```

---

## 7. 环境变量速查

### 7.1 生产服务器（`/opt/lucky/deploy/.env.prod`）

不提交到 Git，直接在 VPS 上维护。模板参考：`deploy/.env.example`

| 分类   | 关键变量                                                         |
| ------ | ---------------------------------------------------------------- |
| 数据库 | `DATABASE_URL` `POSTGRES_USER` `POSTGRES_PASSWORD` `POSTGRES_DB` |
| 缓存   | `REDIS_URL` `REDIS_PASSWORD`                                     |
| JWT    | `JWT_SECRET` `ADMIN_JWT_SECRET`                                  |
| 跨域   | `CORS_ORIGIN` `FRONTEND_URL`                                     |
| 第三方 | `FIREBASE_*` `RESEND_API_KEY` `RECAPTCHA_SECRET_KEY`             |
| OAuth  | `GOOGLE_CLIENT_ID`                                               |
| TURN   | `TURN_URL` `TURN_SECRET`                                         |
| 通知   | `TELEGRAM_TOKEN` `TELEGRAM_CHAT_ID`                              |

### 7.2 GitHub Secrets（Settings → Environments → production）

| Secret                                         | 说明                                   |
| ---------------------------------------------- | -------------------------------------- |
| `SSH_HOST` `SSH_USERNAME` `SSH_PRIVATE_KEY`    | SSH 到 VPS                             |
| `VPS_GHCR_PAT`                                 | VPS 登录 GHCR 拉镜像                   |
| `CLOUDFLARE_API_TOKEN` `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Workers 部署                |
| `NEXT_PUBLIC_API_BASE_URL`                     | 必须是 `https://api.joyminis.com/api`  |
| `NEXT_PUBLIC_WS_URL`                           | WebSocket 地址                         |
| `CF_ADMIN_HEALTHCHECK_URL`                     | Smoke Check 地址                       |
| `TELEGRAM_TOKEN` `TELEGRAM_CHAT_ID`            | 部署战报通知                           |
| `E2E_ADMIN_PASSWORD`                           | Playwright E2E（可选，未设则跳过 E2E） |

### 7.3 Cloudflare Token 权限最小要求

| 类型              | 内容                                           |
| ----------------- | ---------------------------------------------- |
| Permissions       | `Account > Workers Scripts > Edit`             |
| Permissions       | `Account > Workers Assets > Edit`              |
| Permissions       | `User > User Details > Read`（可选，避免告警） |
| Account Resources | `Include > All accounts`                       |
| Zone Resources    | `Include > All zones`（Cloudflare UI 必填）    |

---

## 8. 常见故障速查

### 8.1 容器里跑 seed 报 workspace root 错误

```text
Cannot find the root of your workspace
```

**原因**：生产容器没有 monorepo workspace 根目录，不能用 `yarn workspace`。

**正确做法**：

```bash
docker exec -it lucky-backend-prod node /app/apps/api/dist/cli/seed/run-seed.js
docker exec -it lucky-backend-prod node /app/apps/api/dist/cli/cli/create-admin.js
```

### 8.2 发布后健康检查失败

```bash
docker logs --tail=200 lucky-backend-prod
docker logs --tail=200 lucky-nginx-prod
```

确认是新版本问题 → 回滚：

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn rollback:backend
```

### 8.3 迁移报 `P3005`

```bash
ssh root@107.175.53.104
cd /opt/lucky
bash deploy/baseline-db.sh
```

然后重新发布。

### 8.4 生产 Prisma 落后（新模型 undefined / 功能异常但无 Error 日志）

**诊断**（对比本地迁移列表 vs 生产已跑迁移，见 `4.3`）：

```bash
# 本地迁移列表
ls apps/api/prisma/migrations/
```

**根因**：后端 workflow 没有完整跑完（构建失败 / 合并的代码没触发 apps/api 路径）。

**修复方式（三选一）**：

```bash
# 方式一：GitHub Actions → deploy-backend → Run workflow（手动触发）
# 方式二：手动补跑迁移（见 4.3 第③步）
# 方式三：推一个 apps/api 路径下的小改动触发自动部署
```

### 8.5 Admin Cloudflare 部署失败

| 现象                                 | 原因                                 | 解法                               |
| ------------------------------------ | ------------------------------------ | ---------------------------------- |
| `Authentication error [code: 10000]` | Token 失效                           | 重新生成 Token，更新 GitHub Secret |
| `quality` job 失败                   | lint/typecheck/单测没过              | 本地修复再推                       |
| `Smoke Check` 失败                   | Workers 部署成功但页面异常           | 检查 `CF_ADMIN_HEALTHCHECK_URL`    |
| 登录请求变成 `/v1/...`               | `NEXT_PUBLIC_API_BASE_URL` 少 `/api` | 修 Secret → 重新部署               |

### 8.6 后端容器启动崩溃

```bash
docker logs --tail=50 lucky-backend-prod
```

| 日志关键字                            | 原因                  | 解法                                       |
| ------------------------------------- | --------------------- | ------------------------------------------ |
| `prisma/client/runtime` 找不到 binary | Prisma binary 不匹配  | 检查 `schema.prisma` binaryTargets         |
| `PrismaClientInitializationError`     | generate 没跑         | 重建镜像（重触发 deploy-backend workflow） |
| `ECONNREFUSED` (db/redis)             | 数据库/Redis 还没起来 | `docker compose ps` 检查依赖容器           |

---

## 9. 低频参考

### 9.1 本地提交前检查

```bash
yarn lint:staged       # 等同 pre-commit，staged 文件走 Prettier + ESLint
yarn prepush:light     # lint + check-types（@repo/ui + @lucky/admin-next）
yarn prepush:heavy     # 上面 + admin-next 单测
yarn prepush:api       # API 专项检查
```

跳过 hook（紧急情况）：

```bash
git push --no-verify
```

### 9.2 Schema 变更本地流程

```bash
# 1. 改 schema.prisma
# 2. 生成迁移
yarn workspace @lucky/api prisma migrate dev --name 描述

# 3. 同步本地 IDE 类型
node apps/api/node_modules/.bin/prisma generate \
  --schema apps/api/prisma/schema.prisma

# 4. 重启后端容器（让容器内重跑 generate）
docker compose --env-file deploy/.env.dev up -d backend

# 5. 把迁移文件一起提交
git add apps/api/prisma/
```

### 9.3 packages 变更后必做

```bash
node packages/shared/scripts/build.js   # 改了 packages/shared
node packages/ui/scripts/build.js       # 改了 packages/ui
```

### 9.4 备份 / 监控 / 证书

```bash
bash deploy/backup.sh      # 数据库备份
bash deploy/monitor.sh     # 监控脚本
bash deploy/renew-cert.sh  # SSL 证书续期
```

### 9.5 Self-hosted Runner

只在 GitHub Hosted Runner 排队太久时使用（`workflow_dispatch` → Runner 选 `self-hosted`）。

---

## 10. 文档维护规则

- 发布与运维流程，只维护这一个文件：`RUNBOOK.md`
- 其它 `read/` 文档只负责补充背景，不重复写操作步骤
- 以下文件变化时，必须同步更新本文：
  - `deploy/*.sh`
  - `compose.prod.yml`
  - `.github/workflows/*.yml`
  - 生产相关命令路径
