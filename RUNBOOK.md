# Lucky Nest 发布与运维唯一手册

> 这是仓库中唯一维护的发布文档。涉及部署、回滚、备份、监控、证书、上线检查的流程，统一以本文为准。
>
> 最后更新: 2026-03-21

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

## 3) 发布脚本清单（可以在本地（你的电脑）使用的命令）

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
scp deploy/server-init.sh root@107.175.53.104:/root/
ssh root@107.175.53.104 'chmod +x /root/server-init.sh && /root/server-init.sh'
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
- 触发路径命中：`apps/admin-next/**`、`packages/shared/**`、`packages/ui/**`、`.github/workflows/deploy-admin-cloudflare.yml` 或手动触发。
- 必需 Secrets（按对应 GitHub Environment 配置）：
  - `CLOUDFLARE_API_TOKEN` — 必须有效，可通过 Step 7「Validate Cloudflare Secrets」自动预检
  - `CLOUDFLARE_ACCOUNT_ID`
  - `NEXT_PUBLIC_API_BASE_URL`
- 建议 Secrets：`CF_ADMIN_HEALTHCHECK_URL`（用于主分支 smoke check）。
- 可选 Secrets：`NEXT_PUBLIC_WS_URL`、`TELEGRAM_TOKEN`、`TELEGRAM_CHAT_ID`。
- Cloudflare 构建文件存在：`apps/admin-next/wrangler.jsonc`、`apps/admin-next/open-next.config.ts`。
- 若改动了共享包：确认已提交对应 build 结果（`packages/shared` / `packages/ui`）。

#### Cloudflare API Token 权限要求（创建/重建 Token 时必看）

| 权限类型           | 资源                                 | 权限                          |
| ------------------ | ------------------------------------ | ----------------------------- |
| Permissions        | Account > Workers Scripts            | Edit                          |
| Permissions        | Account > Workers Assets             | Edit                          |
| Permissions        | User > User Details                  | Read（可选，避免 email 警告） |
| Account Resources  | Include > All accounts（或指定账户） | —                             |
| **Zone Resources** | **Include > All zones**              | **— ← UI 必填，不选无法保存** |

> ⚠️ Zone Resources 是 Cloudflare UI 表单强制字段，Workers 部署本身不需要 Zone 权限，但不填则无法保存 Token。

Token 创建地址：https://dash.cloudflare.com/profile/api-tokens

### 6.2 Admin Cloudflare 首次失败排障（按报错关键字）

| 报错关键字                                                 | 优先检查项                                                                                                              | 处理动作                                                                                                                           |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `Invalid API token` / `Authentication error [code: 10000]` | `CLOUDFLARE_API_TOKEN` 是否配置在当前 Environment（注意是 Environment Secret，不是 Repo Secret），Token 是否过期/被撤销 | 重建 Token（见 6.1 权限表），更新 `production` Environment Secret                                                                  |
| `CLOUDFLARE_ACCOUNT_ID` / `account id`                     | Account ID 是否与 Token 所属账户一致                                                                                    | 到 Cloudflare 控制台复制 Account ID，覆盖 Secret                                                                                   |
| `Unable to retrieve email` / `User Details Read`           | Token 缺少 `User > User Details > Read` 权限                                                                            | 重建 Token 时勾选该权限（非阻断性，仅警告）                                                                                        |
| `Artifact storage quota has been hit`                      | GitHub Actions artifact 存储已满（免费 500 MB 上限）                                                                    | 到仓库 Actions → Artifacts 手动清理历史 artifact；deploy-admin-cloudflare.yml 已移除 artifact 上传步骤，信息改由 Step Summary 保留 |
| `open-next.config.ts` / `wrangler.jsonc` not found         | 文件路径是否在 `apps/admin-next/`                                                                                       | 恢复文件并重试部署                                                                                                                 |
| `NEXT_PUBLIC_API_BASE_URL` missing                         | 当前 Environment 是否有该 Secret                                                                                        | 补齐后重跑 workflow                                                                                                                |
| `quality` job failed (`lint`/`check-types`/`test`)         | 代码质量关口失败                                                                                                        | 先修复代码，再触发部署 job                                                                                                         |
| `Failed to create GitHub deployment`                       | workflow 权限                                                                                                           | 确认 `deployments: write` 未被移除                                                                                                 |
| `Smoke Check` failed                                       | `CF_ADMIN_HEALTHCHECK_URL` 是否可访问                                                                                   | 先本地 `curl` 验证 URL，再修复健康检查地址                                                                                         |
| Telegram send failed                                       | 通知配置缺失                                                                                                            | 补齐 Telegram secrets，或接受通知失败不阻断发布                                                                                    |

### 6.4 main 分支保护（强制 PR — 安全必配项）

> ⚠️ **本项目高风险点**：`main` 分支的任何 push 都会**立即触发生产部署**（后端 VPS 重启 + Cloudflare Workers 更新），直接 push = 直接上线，中间没有任何缓冲。

#### 为什么必须开启

| 层次         | 未开启的风险                                        | 开启后的保护                           |
| ------------ | --------------------------------------------------- | -------------------------------------- |
| **操作安全** | 手抖 / 脚本误操作 `git push origin main` = 立即上线 | 必须经过 PR，物理上不可能直接 push     |
| **质量门禁** | CI 是 post-merge（代码坏了才发现，已在生产）        | CI 是 pre-merge 门禁，挂了就不让合并   |
| **审计追踪** | 生产变更无记录，出事找不到是谁改的                  | 每次上线都有 PR + review + CI 状态留档 |
| **协作安全** | 任何有 push 权限的人可绕过所有检查直接上线          | 即使仓库 owner 也要走 PR 流程          |

#### 一次性配置（GitHub UI）

> 仓库 → **Settings** → **Branches** → **Add branch protection rule**

```
Branch name pattern:  main
```

按下图勾选：

- ☑ **Require a pull request before merging**
  - Number of approvals required: `1`（单人项目可设 0，但保留审查习惯）
  - ☑ Dismiss stale pull request approvals when new commits are pushed
- ☑ **Require status checks to pass before merging**
  - 在搜索框输入 `check`，选中 CI workflow 的 **`check`** job
  - ☑ Require branches to be up to date before merging
- ☑ **Require conversation resolution before merging**（可选）
- ☑ **Do not allow bypassing the above settings**（管理员也不能绕过，建议勾选）

点 **Create** 保存。

> CI `check` job 出现在搜索框的前提：`ci.yml` 已配置 `pull_request: branches: [main]`（已完成，见当前 `ci.yml`）。如果搜索不到，先开一个 draft PR 触发一次 CI 即可。

#### 配置后的标准发布流程

```
feature/fix 分支 (本地开发)
        ↓  git push origin feature/xxx
dev 分支 (集成)
        ↓  PR dev → test
test 分支 (验证 + 预部署，触发后端 VPS + Cloudflare preview)
        ↓  PR test → main  （必须 CI 绿灯才能合并）
main 分支 → 自动触发生产部署
```

#### 紧急修复绕过（hotfix）

极端情况下确实需要绕过 PR（如生产宕机紧急回滚），操作方法：

```bash
# 方法 1：临时禁用分支保护（Settings → Branches → Edit → 取消 Bypass 限制）
# 操作完成后立即重新开启

# 方法 2：用 deploy-master.yml 手动触发（推荐，不需要改分支保护）
# Actions → 🚀 Master Deployment Control → Run workflow
```

> 任何绕过分支保护的操作都应在 Slack/Issue 里记录原因，补上事后 PR。

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
curl -k https://107.175.53.104/api/v1/health
ssh root@107.175.53.104 'cd /opt/lucky && docker compose -f compose.prod.yml ps'
ssh root@107.175.53.104 'docker logs --tail=100 lucky-backend-prod'
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

- `deploy-admin-cloudflare.yml` 会记录 Cloudflare deployment id/version id 到 Job Summary（Step 12）。
- Telegram 通知（Step 15）同步播报 deployment id / version id / commit。
- ~~artifact 上传~~：已移除（曾因存储配额问题阻断流水线，信息已由 Summary 完全覆盖）。
- 回退时优先查看最近一次成功部署的 Actions Summary，再执行 DNS 回滚命令。

## 9) 数据库与 Seed 规则

- 生产迁移: 仅使用 `migrate deploy`。
- 生产 seed: 仅首发执行一次全量 seed。
- 首发后: 禁止重复全量 seed，业务数据通过后台手动维护。
- 开发 seed: 可反复执行（当前已支持宿主机自动将 `DATABASE_URL` 的 `db` 改写为 `localhost`）。

## 10) 运维脚本（VPS）

### 10.1 备份

```bash
scp deploy/backup.sh root@107.175.53.104:/opt/lucky/deploy/
ssh root@107.175.53.104 'chmod +x /opt/lucky/deploy/backup.sh'
ssh root@107.175.53.104 '(crontab -l 2>/dev/null; echo "0 3 * * * /opt/lucky/deploy/backup.sh >> /var/log/lucky-backup.log 2>&1") | crontab -'
```

### 10.2 监控

```bash
scp deploy/monitor.sh root@107.175.53.104:/opt/lucky/deploy/
ssh root@107.175.53.104 'chmod +x /opt/lucky/deploy/monitor.sh'
ssh root@107.175.53.104 '(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/lucky/deploy/monitor.sh >> /var/log/lucky-monitor.log 2>&1") | crontab -'
```

### 10.3 证书续期

```bash
scp deploy/renew-cert.sh root@107.175.53.104:/opt/lucky/deploy/
ssh root@107.175.53.104 'chmod +x /opt/lucky/deploy/renew-cert.sh'
ssh root@107.175.53.104 '(crontab -l 2>/dev/null; echo "0 3 * * 1 /opt/lucky/deploy/renew-cert.sh >> /var/log/lucky-cert.log 2>&1") | crontab -'
```

## 11) 常见故障速查

- `Can't reach database server at db:5432`:
  - 在宿主机执行脚本时使用了容器内主机名 `db`，改为通过统一脚本入口运行（已在 seed 链路处理）。
- 发布后健康检查失败:
  - 查看 `lucky-backend-prod` 最近日志，必要时执行 `yarn rollback:backend`。
- 迁移报 `P3005`:
  - 按提示在 VPS 执行 `bash deploy/baseline-db.sh` 后重试。

### Docker 构建常见报错（Dockerfile.prod）

| 报错                                                        | 根因                                                                                             | 修复                                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `Couldn't find a script named "turbo"`                      | `turbo` 在 root devDependencies，`yarn workspaces focus @lucky/api` 不安装 root devDeps          | 已修复：用 `yarn workspace @lucky/api build` 替代 `yarn turbo run build`                 |
| `node_modules/.bin/tsc: not found`（在 `apps/api/` 子目录） | Yarn 4 `nodeLinker: node-modules` 将 `typescript` 提升到根 `node_modules`，不在 workspace 子目录 | 已修复：统一从根目录调用 `node_modules/.bin/tsc -p apps/api/tsconfig.cli.json`           |
| `Cannot find module '@lucky/shared/dist/types/*'`           | `@lucky/shared` 未编译，`dist/` 不存在；`esbuild` 只在 `admin-next`，focused 安装不包含          | 已修复：在 api build 前先执行 `node_modules/.bin/tsc -p packages/shared/tsconfig.json`   |
| `COPY --from=builder /app/apps/api/node_modules: not found` | Docker 干净环境下 focused 安装无版本冲突，所有包提升到根 `node_modules`，子目录不存在            | 已修复：builder 末尾加 `RUN mkdir -p apps/api/node_modules packages/shared/node_modules` |

### CI / 分支触发常见问题

| 问题                                                      | 根因                                                                        | 修复                                                                      |
| --------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 推 `test` 分支但后端未部署                                | `deploy-backend.yml` 只配置了 `branches: [main]`                            | 已修复：改为 `branches: [main, test]`                                     |
| `check-types` 报 `Cannot find module './data/ph-address'` | `seed-address.ts` 在 `main`/`test`，但其依赖 `ph-address.ts` 只在本地未推送 | 已修复：push 本地 dev commit，merge 到 test                               |
| `yarn workspace @lucky/api lint -- --fix` 报错            | Yarn 4 将 `--` 原样传给 ESLint，`--fix` 被当作文件 glob                     | 已修复：在 `apps/api/package.json` 加 `"lint:fix"` 脚本，直接内嵌 `--fix` |

## 12) 文档维护规则

- 发布相关内容只更新本文件。
- 其他文档仅保留跳转说明，不再写重复流程。
- 当 `deploy/*.sh`、`compose.prod.yml`、根发布脚本变更时，必须同步更新本文件。

## 13) 本地算力（Self-Hosted Runner）

GitHub 免费额度有限，排队时可切换到本地 Mac 运行部署任务。

### 13.1 适用场景

- GitHub Actions 排队超过 5 分钟。
- 需要紧急发布，不想等 GHA 调度。

### 13.2 一次性注册（已注册可跳过）

```bash
# 1. 在 GitHub 仓库 → Settings → Actions → Runners → New self-hosted runner
# 2. 选择 macOS / arm64，按页面指引下载并配置 runner
# 3. 启动 runner（长期运行建议配置为 launchd service）
./run.sh
```

### 13.3 触发方式

所有部署工作流（`deploy-backend.yml`、`deploy-admin-cloudflare.yml`、`deploy-admin.yml`）均支持 `runner` 输入参数：

**通过 `deploy-master.yml`（推荐）**：

1. GitHub 仓库 → Actions → **🚀 Master Deployment Control** → Run workflow
2. `Runner` 下拉选择 `self-hosted`
3. 按需勾选要部署的服务

**直接触发单个工作流**：

1. 选择对应工作流 → Run workflow
2. `Runner` 下拉选择 `self-hosted`

### 13.4 注意事项

- 后端 Docker build 在 Apple Silicon 构建 `linux/amd64` 镜像需要 QEMU 模拟，速度比 x86 慢约 3–5 倍，但无需排队。
- 需要本地安装 Docker Desktop 并开启 **Use Rosetta for x86/amd64 emulation**。
- self-hosted runner 运行期间需保持 Mac 联网且不休眠。
- `push` 自动触发的工作流仍走 `ubuntu-latest`；`self-hosted` 仅对手动触发生效。
