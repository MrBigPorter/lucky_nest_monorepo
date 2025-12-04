# Lucky Monorepo · 标准流程化指引（稳定版）

> 适用于本仓库的所有应用与包（apps/_、packages/_）。目标：让新同学 10 分钟跑通、本地开发顺滑、提交规范统一、构建/测试可复用、CI/CD 易落地。

---

## 1. 环境准备

- Node.js ≥ 18（见根 package.json engines）
- 包管理器：Yarn 4（已在 packageManager 指定）
- 推荐：Docker（用于本地数据库等服务），Git，VS Code + ESLint/Prettier 插件

检查版本：

```bash
yarn -v
node -v
```

---

## 2. 安装与初始化

在仓库根目录执行：

```bash
yarn install
```

可选：清理旧产物

```bash
yarn clean
```

---

## 3. 常用脚本（在仓库根目录执行）

- 开发：`yarn dev` → 等价 `turbo run dev`，并行启动需要 dev 的子包。
- 构建：`yarn build` → 等价 `turbo run build`，按依赖拓扑构建全部子包。
- 测试：`yarn test` → 运行各子包 test 脚本（若有配置）。
- Lint：`yarn lint` → 运行各子包 lint 脚本（若有配置）。
- 类型检查：`yarn check-types` → 运行各子包的类型检查。
- 代码格式：`yarn format` → Prettier 格式化全仓库 TS/TSX/MD。
- 清理：`yarn clean` → 清各包的 clean，并删除根 .turbo 和 node_modules。

仅针对某个 app/package 运行（Turbo filter）：

```bash
yarn build --filter=@lucky/shared
yarn dev --filter=web
```

Workspaces 直达：

```bash
yarn workspace @lucky/api start:dev
```

---

## 4. 子项目快速开始

### 4.1 API（NestJS）

参考 apps/api/README.md 的“快速开始”。最简流程：

```bash
# 起 Postgres（Docker）
docker run --name dev-postgres -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_USER=dev -e POSTGRES_DB=app \
  -p 5432:5432 -d postgres:16

# 环境变量示例
cp apps/api/.env.example apps/api/.env

# 初始化数据库（首次）
yarn workspace @lucky/api prisma migrate dev

# 开发启动
yarn workspace @lucky/api start:dev
```

访问 Swagger: http://localhost:3001/docs

### 4.2 Web（Next.js）

```bash
yarn workspace web dev
```

默认端口见对应包的 README/package.json。

### 4.3 Shared（库包）

```bash
yarn workspace @lucky/shared build
```

构建产物位于 packages/shared/dist。

---

## 5. 分支与提交流程（建议）

- 分支：
  - main：受保护分支，随时可发布
  - feat/_、fix/_、chore/\*：功能/修复/杂项
- 提交信息（示例）：
  - feat(api): add user registration
  - fix(web): debounce search input
  - chore(shared): bump version
- PR 规范：
  - 关联 Issue，描述动机与变更点
  - 附带运行截图/接口说明（如影响外部行为）
  - CI 需通过（见下方建议）

如需 commitlint/husky，可在后续引入，但当前仓库未强制。

---

## 6. 代码质量

- Lint：统一走 `yarn lint`（各包应提供 eslint 配置，如 packages/eslint-config）。
- 格式：`yarn format`，或启用编辑器保存自动格式化。
- 类型：`yarn check-types`，保证 TS 类型健康。
- 单测/E2E：各包维护自有测试脚本，根层统一 `yarn test` 聚合。

---

## 7. 环境与配置

- TypeScript：全仓库 TypeScript，tsconfig 由 packages/typescript-config 提供基础配置。
- ESLint/Prettier：由 packages/eslint-config 和根 prettier 配置统一风格。
- Turbo：任务编排与缓存（支持远程缓存，可选接入 Vercel）。

运行单一任务并观测缓存效果：

```bash
yarn build --filter=docs
```

---

## 8. 构建与发布（建议流程）

1. 本地验证

- `yarn clean && yarn build && yarn test && yarn check-types`
- 关键应用手动起一下：`yarn dev --filter=web`、`yarn workspace @lucky/api start`

2. 版本与变更

- 若采用手动版本：在各需发布包的 package.json bump 版本；更新 CHANGELOG。
- 若采用 Changesets（可后续接入）：`yarn changeset` 管理变更，PR 合并自动发版。

3. 部署（示例）

- Web（Next）：容器化或 Vercel 部署（需设置环境变量）。
- API（Nest）：容器化 + 数据库连接；生产建议启用多进程/PM2 与反向代理。

---

## 9. CI/CD（最小落地建议）

可选 GitHub Actions 工作流（示例步骤）：

- node/setup → yarn cache
- yarn install
- yarn check-types
- yarn lint
- yarn test
- yarn build
- （可选）turbo 远程缓存接入：`turbo login && turbo link`

发布阶段（可选）：

- 使用 Changesets 或自定义脚本进行发布/打包。

---

## 10. 故障排查（FAQ）

- 依赖装不上/类型错乱：
  - 删除根 node_modules 与 .turbo，`yarn clean && yarn install`。
- API Swagger 空白：
  - 确认 apps/api 的 Swagger 挂载代码与端口，浏览器控制台是否有跨域/脚本错误。
- Prisma 连接失败：
  - 检查 `.env` 的 `DATABASE_URL`，确保本地数据库已启动且端口可达。
- 构建缓存不生效：
  - 修改 files/globs 是否命中；或尝试 `turbo prune`（如采用 monorepo 拆分构建方案）。

---

## 11. 术语对照

- app：可运行的应用（web/docs/api）
- package：库/配置/类型等复用单元（shared/ui/typescript-config/eslint-config）
- workspace：Yarn 工作区（指向 apps/_、packages/_）
- filter：Turbo 的包/任务筛选语法（如 `--filter=web`）

---

若你只想“最快跑通”：

1. `yarn install`
2. `yarn dev --filter=web`（前端）或按上面“API 快速开始”启动后端
3. 代码提交走“分支与提交流程”小节即可
