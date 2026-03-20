# Lucky Nest Monorepo

这是 Lucky Nest 的生产仓库（Yarn Workspace + Turborepo）。

## 新人先读这 3 份

- 部署快启（Cloudflare Admin + VPS API）：`read/DEPLOY_QUICKSTART_CN.md`
- 发布与回滚手册（运维细节）：`RUNBOOK.md`
- 架构总览（全景理解）：`ARCHITECTURE_CN.md`

## 当前生产形态

- `admin.joyminis.com`：Cloudflare Workers 托管 `apps/admin-next`
- `api.joyminis.com`：VPS Docker 运行 Nest API（Nginx API-only）
- WebSocket：`wss://api.joyminis.com/socket.io/`

## 本地常用命令

```bash
yarn dev
yarn build
yarn docker:up
yarn docker:down
```

## 部署相关命令

```bash
yarn deploy:backend
yarn switch:admin:dns
yarn switch:admin:dns:execute
yarn rollback:admin:dns
yarn rollback:admin:dns:execute
```
