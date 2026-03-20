# 文档迁移记录

> 目的：记录旧文档到新入口的替代关系，避免新人读到过期流程。
> 生效日期：2026-03-20

## 迁移映射

| 旧文档 | 新入口 | 状态 | 备注 |
| --- | --- | --- | --- |
| `DOCKER.md` | `read/DEPLOY_QUICKSTART_CN.md` + `RUNBOOK.md` | 已迁移 | 旧文档改为跳转壳 |
| `COMPOSE_README.md` | `read/DEPLOY_QUICKSTART_CN.md` + `RUNBOOK.md` | 已迁移 | 旧文档改为跳转壳 |
| `PROCESS_CN.md` | `RUNBOOK.md` | 已迁移 | 旧文档改为跳转壳 |
| `deploy/README.md` | `RUNBOOK.md` | 已迁移 | 旧文档改为跳转壳 |

## 统一维护约定

- 新人上手步骤：只维护 `read/DEPLOY_QUICKSTART_CN.md`。
- 发布/切流/回滚/运维流程：只维护 `RUNBOOK.md`。
- 旧文档只保留跳转说明，不再写流程细节。

