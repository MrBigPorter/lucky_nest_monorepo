# Lucky Nest 发布与运维手册

> 本文只保留“上线时真正会用到”的内容。目标是：**看得懂、能直接复制命令执行、出问题先知道看哪里**。
>
> 最后更新：2026-03-21

## 0. 先记住这 6 件事

- **后端主入口**：`https://api.joyminis.com/api/v1/health`
- **Admin 主入口**：`https://admin.joyminis.com`
- **生产目录**：`/opt/lucky`
- **后端容器**：`lucky-backend-prod`
- **Nginx 容器**：`lucky-nginx-prod`
- **数据库容器**：`lucky-db-prod`

### 0.1 30 秒故障判断

- **如果 API 不通**：先看 `5.1 最小验收` 的健康检查，再看 `4.1` 和 `8.2`。
- **如果 Admin 能打开但登录接口地址错了**：先看 `5.2`，重点检查 `NEXT_PUBLIC_API_BASE_URL` 是否少了 `/api`。
- **如果容器状态不对或服务没起来**：先跑 `4.1 查看服务状态`，再看 `1.2` 里的日志命令。
- **如果确认是新版本导致异常**：不要先手改线上，优先看 `6.1 后端回滚` 或 `6.3 Admin Cloudflare DNS 回滚`。

---

## 1. 最常用命令速查

### 1.1 本地发布命令（在你的 Mac 上执行）

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo

yarn deploy            # 全量发布（后端 + Admin fallback）
yarn deploy:backend    # 仅后端
yarn deploy:admin      # 仅 Admin VPS fallback

yarn deploy:sync       # 只同步配置

yarn deploy:quick      # 跳过构建，只重启服务

yarn rollback:backend  # 后端回滚
yarn rollback:db       # 数据库回滚（高风险）
```

### 1.2 服务器常用命令（SSH 到 VPS 后执行）

```bash
ssh root@***REDACTED***
cd /opt/lucky

docker compose -f compose.prod.yml --env-file deploy/.env.prod ps
docker logs --tail=200 lucky-backend-prod
docker logs --tail=200 lucky-nginx-prod
docker logs --tail=200 lucky-db-prod
docker logs --tail=200 lucky-redis-prod
```

---

## 2. 生产首发（第一次上线时做）

### 2.1 初始化 VPS

```bash
scp deploy/server-init.sh root@***REDACTED***:/root/
ssh root@***REDACTED*** 'chmod +x /root/server-init.sh && /root/server-init.sh'
```

### 2.2 首次部署

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn deploy
```

### 2.3 首次 seed（只执行一次）

```bash
docker exec -it lucky-backend-prod node apps/api/dist/scripts/seed/run-seed.js
```

> 生产容器里**不要**用：
>
> ```bash
> yarn workspace @lucky/api seed
> ```
>
> 因为生产容器里没有 monorepo workspace 根目录，会报：
> `Cannot find the root of your workspace`

### 2.4 创建 / 重置管理员密码

```bash
docker exec -it lucky-backend-prod node apps/api/dist/scripts/cli/create-admin.js
```

说明：

- 会交互式输入用户名、显示名、密码
- 如果用户名已存在，会询问是否重置密码
- 这是生产环境**推荐方式**

---

## 3. 日常发布

### 3.1 推荐流程（平时这样做）

1. 本地开发并提交代码
2. 推到远端并走 PR
3. 合并到 `main`
4. GitHub Actions 自动执行：
   - 后端：`deploy-backend.yml`
   - Admin：`deploy-admin-cloudflare.yml`

### 3.2 手动发布后端（兜底）

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn deploy:backend
```

### 3.3 配置变更但不想重建镜像

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn deploy:sync
yarn deploy:quick
```

适用场景：

- `compose.prod.yml`
- `nginx/nginx.prod.conf`
- `deploy/.env.prod`
- 证书 / Nginx / 脚本变更

---

## 4. 服务器上最常用操作

### 4.1 查看服务状态

```bash
cd /opt/lucky
docker compose -f compose.prod.yml --env-file deploy/.env.prod ps
```

### 4.2 重启单个服务

```bash
cd /opt/lucky

docker compose -f compose.prod.yml --env-file deploy/.env.prod up -d --no-build --force-recreate backend
docker compose -f compose.prod.yml --env-file deploy/.env.prod up -d --no-build --force-recreate nginx
```

### 4.3 手动执行生产迁移（仅必要时）

```bash
docker exec -it lucky-backend-prod sh -lc "./node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma"
```

> 正常发布时，后端 entrypoint 会自动执行迁移。这个命令只用于单独补迁移。

### 4.4 只读进入数据库

```bash
docker exec -it lucky-db-prod sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

> 建议优先做查询，不要直接在线手写修改数据。

### 4.5 恢复 TURN 服务器（视频/语音通话）

如果 VPS 被重置、TURN 丢失，按下面做：

```bash
ssh root@***REDACTED***
cd /opt/lucky

export TURN_SECRET="替换成一段长随机字符串"
export TURN_PUBLIC_IP="你的 VPS 公网 IP"
export TURN_DOMAIN="turn.joyminis.com" # 没有域名时也可以先填公网 IP

bash deploy/install-turn.sh
```

然后更新后端环境变量：

```bash
nano /opt/lucky/deploy/.env.prod
```

写入：

```dotenv
TURN_SECRET=与你安装 coturn 时相同的 secret
TURN_URL=turn:turn.joyminis.com:3478?transport=udp
```

最后重启后端：

```bash
cd /opt/lucky
docker compose -f compose.prod.yml --env-file deploy/.env.prod up -d --no-build --force-recreate backend
```

快速验证：

```bash
ss -lntup | grep 3478
tail -n 100 /var/log/turnserver.log
```

---

## 5. 发布后验证

### 5.1 最小验收

```bash
curl -sS https://api.joyminis.com/api/v1/health
ssh root@***REDACTED*** 'cd /opt/lucky && docker compose -f compose.prod.yml ps'
ssh root@***REDACTED*** 'docker logs --tail=100 lucky-backend-prod'
```

再手动确认：

- `https://admin.joyminis.com` 可以打开
- 登录后台正常
- 至少点开一个后台列表页

### 5.2 如果看到 API 请求少了 `/api`

错误示例：

```text
https://api.joyminis.com/v1/auth/admin/login
```

正确应为：

```text
https://api.joyminis.com/api/v1/auth/admin/login
```

先检查：

1. GitHub Environment Secret：`NEXT_PUBLIC_API_BASE_URL`
2. 它必须是：`https://api.joyminis.com/api`
3. 改完后**必须重新部署 Admin**，因为 `NEXT_PUBLIC_*` 是构建时注入

---

## 6. 回滚

### 6.1 后端回滚

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn rollback:backend
```

### 6.2 数据库回滚（高风险，最后手段）

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn rollback:db
```

> 这会覆盖当前数据库，只在明确数据事故时执行。

### 6.3 Admin Cloudflare DNS 回滚

先 dry-run：

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
export CLOUDFLARE_API_TOKEN="<token>"
export CLOUDFLARE_ZONE_ID="<zone_id>"
export CLOUDFLARE_DNS_RECORD_ID="<record_id>"
export CF_ROLLBACK_TARGET="<target_host_or_ip>"
export CF_ROLLBACK_TYPE="CNAME" # 或 A
yarn rollback:admin:dns
```

确认输出正确后再执行：

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn rollback:admin:dns:execute
```

---

## 7. Admin Cloudflare：只记必须知道的

### 7.1 必需 Secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NEXT_PUBLIC_API_BASE_URL`

其中：

```text
NEXT_PUBLIC_API_BASE_URL = https://api.joyminis.com/api
```

### 7.2 Token 权限最小要求

| 类型              | 内容                                             |
| ----------------- | ------------------------------------------------ |
| Permissions       | `Account > Workers Scripts > Edit`               |
| Permissions       | `Account > Workers Assets > Edit`                |
| Permissions       | `User > User Details > Read`（可选，仅避免告警） |
| Account Resources | `Include > All accounts`                         |
| Zone Resources    | `Include > All zones`（Cloudflare UI 必填）      |

### 7.3 常见报错先看哪里

| 现象                                 | 先看什么                                 |
| ------------------------------------ | ---------------------------------------- |
| `Authentication error [code: 10000]` | `CLOUDFLARE_API_TOKEN` 是否失效          |
| 登录请求变成 `/v1/...`               | `NEXT_PUBLIC_API_BASE_URL` 是否少 `/api` |
| `quality` job failed                 | 先修 lint / typecheck / test             |
| `Smoke Check` failed                 | `CF_ADMIN_HEALTHCHECK_URL`               |

---

## 8. 常见故障速查

### 8.1 容器里跑 seed 报 workspace root 错误

报错：

```text
Cannot find the root of your workspace
```

原因：

- 生产容器里没有 monorepo workspace 根目录
- 不能在容器里跑 `yarn workspace @lucky/api ...`

正确做法：

```bash
docker exec -it lucky-backend-prod node apps/api/dist/scripts/seed/run-seed.js
docker exec -it lucky-backend-prod node apps/api/dist/scripts/cli/create-admin.js
```

### 8.2 发布后健康检查失败

先看日志：

```bash
docker logs --tail=200 lucky-backend-prod
docker logs --tail=200 lucky-nginx-prod
```

如果确认是新版本问题，直接回滚后端：

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn rollback:backend
```

### 8.3 迁移报 `P3005`

按提示在 VPS 执行：

```bash
cd /opt/lucky
bash deploy/baseline-db.sh
```

然后重新发布。

---

## 9. 低频参考

### 9.1 本地提交前检查

```bash
yarn lint:staged
yarn prepush:light
yarn prepush:heavy
yarn prepush:api
```

### 9.2 备份 / 监控 / 证书脚本

- 备份：`deploy/backup.sh`
- 监控：`deploy/monitor.sh`
- 证书续期：`deploy/renew-cert.sh`

### 9.3 Self-hosted Runner

只在 GitHub Hosted Runner 排队太久时使用。

---

## 10. 文档维护规则

- 发布与运维流程，只维护这一个文件：`RUNBOOK.md`
- 其它文档只负责补充背景，不再重复写操作步骤
- 当以下文件变化时，必须同步更新本文：
  - `deploy/*.sh`
  - `compose.prod.yml`
  - `.github/workflows/*.yml`
  - 生产相关命令路径
