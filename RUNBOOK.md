# Lucky Nest 发布与运维唯一手册

> 这是仓库中唯一维护的发布文档。涉及部署、回滚、备份、监控、证书、上线检查的流程，统一以本文为准。
>
> 最后更新: 2026-03-20

## 新人入口（先看这个）

- 快速上手：`read/DEPLOY_QUICKSTART_CN.md`
- 再看细节：`RUNBOOK.md`（本文）
- 架构全景：`ARCHITECTURE_CN.md`

## 本文边界

- 本文负责：生产发布、切流、回滚、排障。
- 本文不重复：架构原理、历史复盘、业务模块说明。

## 快速执行清单（1 屏版）

### A) 生产首发清单（一次性）

- [ ] 完成 VPS 初始化（`deploy/server-init.sh`）
- [ ] 仓库根目录执行 `yarn deploy`
- [ ] 首次执行生产 seed（仅一次）
- [ ] 验证 API 健康：`/api/v1/health`
- [ ] 验证 Admin 可访问并完成一次登录冒烟

### B) 日常发布清单（每次发版）

- [ ] 确认 `deploy/.env.prod` 与迁移已准备
- [ ] 后端改动：执行 `yarn deploy:backend`
- [ ] Admin 需切流时：先 `yarn switch:admin:dns`（dry-run）
- [ ] 确认无误后执行 `yarn switch:admin:dns:execute`
- [ ] 发布后执行最小验收（Admin 首页 + API 健康）

### C) 异常回滚清单（按顺序）

- [ ] Admin 异常：先 `yarn rollback:admin:dns`（dry-run）
- [ ] 确认目标后执行 `yarn rollback:admin:dns:execute`
- [ ] 后端异常：执行 `yarn rollback:backend`
- [ ] 数据事故：最后手段 `yarn rollback:db`
- [ ] 回滚后复验 Admin 与 API

## 1) 目标与范围

- 目标: 用最少步骤稳定完成发布、回滚、排障。
- 范围: `deploy/*.sh`、根 `package.json` 发布脚本、`compose.prod.yml` 的生产运行流程。
- 约束: 生产环境默认只在首发阶段执行一次全量 seed，后续通过后台手动维护业务数据。

## 2) 一图看懂发布链路

- 自动链路（推荐）: GitHub Actions 构建镜像 -> 推送 GHCR -> VPS 拉取并重启。
- 手动链路（兜底）: 本地执行 `deploy/deploy.sh` -> 本地构建镜像并传输到 VPS -> 迁移 -> 启动服务。

## 3) 发布脚本清单（唯一真相）

| 脚本/命令                         | 用途                              | 典型场景                |
| --------------------------------- | --------------------------------- | ----------------------- |
| `yarn deploy`                     | 全量发布（后端+Admin）            | 常规手动发布            |
| `yarn deploy:backend`             | 仅后端发布                        | API 改动                |
| `yarn deploy:admin`               | 仅 Admin 发布                     | 前端改动                |
| `yarn deploy:quick`               | 跳过构建，仅重启                  | 配置变更后快速生效      |
| `yarn deploy:sync`                | 仅同步配置文件                    | 证书/Nginx/Compose 更新 |
| `yarn rollback`                   | 服务级回滚                        | 发布后异常快速恢复      |
| `yarn rollback:backend`           | 仅后端回滚                        | 后端异常                |
| `yarn rollback:db`                | 恢复最近备份                      | 数据层事故              |
| `yarn switch:admin:dns`           | Admin 域名正向切流演练（dry-run） | Cloudflare 切流前检查   |
| `yarn switch:admin:dns:execute`   | Admin 域名正向切流生效            | Cloudflare 切流执行     |
| `yarn rollback:admin:dns`         | Admin 域名回滚演练（dry-run）     | Cloudflare 切流前检查   |
| `yarn rollback:admin:dns:execute` | Admin 域名回滚生效                | Cloudflare 前端异常     |
| `yarn pr:m:deploy`                | 生产迁移（容器内）                | 独立执行迁移            |
| `yarn db:seed:dev`                | 开发环境 seed                     | 本地/开发初始化         |

## 4) 生产首发（一次性）

### 4.1 VPS 初始化

```bash
scp deploy/server-init.sh root@***REDACTED***:/root/
ssh root@***REDACTED*** 'chmod +x /root/server-init.sh && /root/server-init.sh'
```

### 4.2 首次部署

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn deploy
```

### 4.3 首次数据初始化（仅一次）

```bash
docker exec -it lucky-backend-prod sh -lc "yarn workspace @lucky/api seed"
```

## 5) 日常发布（手动）

### 5.1 后端变更

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn deploy:backend
```

### 5.2 前端变更

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn deploy:admin
```

### 5.3 配置变更（不发版）

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn deploy:sync
yarn deploy:quick
```

## 6) 发布前检查清单

- `deploy/.env.prod` 关键变量完整（数据库、JWT、第三方密钥）。
- 数据库迁移已合并且可执行。
- 若变更了 `packages/shared` 或 `packages/ui`，对应 build 已执行并提交产物/源码一致。
- `compose.prod.yml` 与 `nginx/nginx.prod.conf` 与当前发布目标一致。

### 6.1 Admin Cloudflare 自动部署（上线前 1 分钟检查）

> 适用工作流：`.github/workflows/deploy-admin-cloudflare.yml`

- 分支与环境映射确认：`main -> production`，`test -> preview`。
- 触发路径命中：`apps/admin-next/**`、`packages/shared/**`、`packages/ui/**` 或手动触发。
- 必需 Secrets（按对应 GitHub Environment 配置）：
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `NEXT_PUBLIC_API_BASE_URL`
- 建议 Secrets：`CF_ADMIN_HEALTHCHECK_URL`（用于主分支 smoke check）。
- 可选 Secrets：`NEXT_PUBLIC_WS_URL`、`TELEGRAM_TOKEN`、`TELEGRAM_CHAT_ID`。
- Cloudflare 构建文件存在：`apps/admin-next/wrangler.jsonc`、`apps/admin-next/open-next.config.ts`。
- 若改动了共享包：确认已提交对应 build 结果（`packages/shared` / `packages/ui`）。

### 6.2 Admin Cloudflare 首次失败排障（按报错关键字）

| 报错关键字                                         | 优先检查项                                                      | 处理动作                                                  |
| -------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| `Invalid API token` / `Authentication error`       | `CLOUDFLARE_API_TOKEN` 是否配置在当前 Environment，权限是否正确 | 重新生成/更新 Token，并在 `production`/`preview` 分别校验 |
| `CLOUDFLARE_ACCOUNT_ID` / `account id`             | Account ID 是否与 Token 所属账户一致                            | 到 Cloudflare 控制台复制 Account ID，覆盖 Secret          |
| `open-next.config.ts` / `wrangler.jsonc` not found | 文件路径是否在 `apps/admin-next/`                               | 恢复文件并重试部署                                        |
| `NEXT_PUBLIC_API_BASE_URL` missing                 | 当前 Environment 是否有该 Secret                                | 补齐后重跑 workflow                                       |
| `quality` job failed (`lint`/`check-types`/`test`) | 代码质量关口失败                                                | 先修复代码，再触发部署 job                                |
| `Failed to create GitHub deployment`               | workflow 权限                                                   | 确认 `deployments: write` 未被移除                        |
| `Smoke Check` failed                               | `CF_ADMIN_HEALTHCHECK_URL` 是否可访问                           | 先本地 `curl` 验证 URL，再修复健康检查地址                |
| Telegram send failed                               | 通知配置缺失                                                    | 补齐 Telegram secrets，或接受通知失败不阻断发布           |

### 6.3 本地提交前校验（Husky）

为减少 CI 噪音，仓库已启用本地 Git Hook：

- `pre-commit`：自动执行 `yarn lint:staged`，对暂存文件按工作区路由执行：
  - `apps/admin-next` / `apps/api` / `packages/ui` / `apps/liveness-web`：`Prettier + ESLint --fix`
  - 其它文档/配置文件：仅 `Prettier`
  - `apps/mini-shop-admin`：当前不参与本地 hook
- `pre-push`：按分支自动选择检查强度：
  - `dev` / 其它功能分支 → `yarn prepush:light`
  - `test` / `main` → `yarn prepush:heavy`

`prepush:light`：

- `@repo/ui`：`lint` + `check-types`
- `@lucky/admin-next`：`lint` + `check-types`

`prepush:heavy`：

- 包含 `prepush:light`
- `@lucky/admin-next`：`test`

`prepush:api`（可选）：

- `@lucky/api`：`lint`（当前为发布期临时策略：保留告警可见、避免历史 debt 阻塞上线）

> 当前未把 `@lucky/api` 放入本地 `prepush:heavy`，原因是后端仍有存量 lint debt；后端质量仍由 CI 兜底，待清债后再纳入本地重检查。

常用命令：

```bash
yarn lint:staged
yarn prepush:light
yarn prepush:heavy
yarn prepush:api
yarn prepush:check
```

仅在紧急场景可临时跳过 hook：

```bash
git commit --no-verify
git push --no-verify
```

> 跳过后必须至少手动补跑当前分支对应的检查（`prepush:light` 或 `prepush:heavy`），避免把格式化/类型问题带入 CI。

## 7) 发布后验证清单

```bash
curl -k https://***REDACTED***/api/v1/health
ssh root@***REDACTED*** 'cd /opt/lucky && docker compose -f compose.prod.yml ps'
ssh root@***REDACTED*** 'docker logs --tail=100 lucky-backend-prod'
```

- Admin 页面可访问并登录。
- 核心链路（登录、下单、支付回调、上传）最少走一遍冒烟。
- 观察 5-10 分钟资源占用（1GB 内存机器优先看 OOM 风险）。

## 8) 回滚流程

### 8.1 服务回滚

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn rollback
```

### 8.2 数据回滚（高风险）

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn rollback:db
```

> 数据回滚会覆盖当前库，只在明确事故场景执行。

### 8.3 Admin Cloudflare DNS 回滚

默认是 dry-run，不会改线上记录：

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
export CLOUDFLARE_API_TOKEN="<token>"
export CLOUDFLARE_ZONE_ID="<zone_id>"
export CLOUDFLARE_DNS_RECORD_ID="<record_id>"
export CF_ROLLBACK_TARGET="<target_host_or_ip>"
export CF_ROLLBACK_TYPE="CNAME" # 或 A
yarn rollback:admin:dns
```

确认 dry-run 输出正确后再执行：

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn rollback:admin:dns:execute
```

执行后检查：

```bash
curl -I https://admin.joyminis.com
curl -sS https://api.joyminis.com/api/v1/health
```

### 8.4 Admin Cloudflare DNS 正向切流

默认是 dry-run，不会改线上记录：

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
export CLOUDFLARE_API_TOKEN="<token>"
export CLOUDFLARE_ZONE_ID="<zone_id>"
export CLOUDFLARE_DNS_RECORD_ID="<record_id>"
export CF_SWITCH_TARGET="<target_host_or_ip>"
export CF_SWITCH_TYPE="CNAME" # 或 A
yarn switch:admin:dns
```

确认 dry-run 输出正确后再执行：

```bash
cd /Volumes/MySSD/work/dev/lucky_nest_monorepo
yarn switch:admin:dns:execute
```

执行后检查：

```bash
curl -I https://admin.joyminis.com
curl -sS https://api.joyminis.com/api/v1/health
```

### 8.5 Cloudflare 部署追踪与回退注记

- `deploy-admin-cloudflare.yml` 会记录 Cloudflare deployment id/version id 到 Job Summary。
- 工作流会上传 `admin-cloudflare-release-note-<run_id>` artifact，包含 commit、环境与回退注记。
- 回退时优先查看最近一次成功部署的 Summary/Artifact，再执行 DNS 回滚命令。

## 9) 数据库与 Seed 规则

- 生产迁移: 仅使用 `migrate deploy`。
- 生产 seed: 仅首发执行一次全量 seed。
- 首发后: 禁止重复全量 seed，业务数据通过后台手动维护。
- 开发 seed: 可反复执行（当前已支持宿主机自动将 `DATABASE_URL` 的 `db` 改写为 `localhost`）。

## 10) 运维脚本（VPS）

### 10.1 备份

```bash
scp deploy/backup.sh root@***REDACTED***:/opt/lucky/deploy/
ssh root@***REDACTED*** 'chmod +x /opt/lucky/deploy/backup.sh'
ssh root@***REDACTED*** '(crontab -l 2>/dev/null; echo "0 3 * * * /opt/lucky/deploy/backup.sh >> /var/log/lucky-backup.log 2>&1") | crontab -'
```

### 10.2 监控

```bash
scp deploy/monitor.sh root@***REDACTED***:/opt/lucky/deploy/
ssh root@***REDACTED*** 'chmod +x /opt/lucky/deploy/monitor.sh'
ssh root@***REDACTED*** '(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/lucky/deploy/monitor.sh >> /var/log/lucky-monitor.log 2>&1") | crontab -'
```

### 10.3 证书续期

```bash
scp deploy/renew-cert.sh root@***REDACTED***:/opt/lucky/deploy/
ssh root@***REDACTED*** 'chmod +x /opt/lucky/deploy/renew-cert.sh'
ssh root@***REDACTED*** '(crontab -l 2>/dev/null; echo "0 3 * * 1 /opt/lucky/deploy/renew-cert.sh >> /var/log/lucky-cert.log 2>&1") | crontab -'
```

## 11) 常见故障速查

- `Can't reach database server at db:5432`:
  - 在宿主机执行脚本时使用了容器内主机名 `db`，改为通过统一脚本入口运行（已在 seed 链路处理）。
- 发布后健康检查失败:
  - 查看 `lucky-backend-prod` 最近日志，必要时执行 `yarn rollback:backend`。
- 迁移报 `P3005`:
  - 按提示在 VPS 执行 `bash deploy/baseline-db.sh` 后重试。

## 12) 文档维护规则

- 发布相关内容只更新本文件。
- 其他文档仅保留跳转说明，不再写重复流程。
- 当 `deploy/*.sh`、`compose.prod.yml`、根发布脚本变更时，必须同步更新本文件。
