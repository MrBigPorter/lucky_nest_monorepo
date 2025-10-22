
## TL;DR｜三步启动

   ```bash
   docker compose up -d --build
   ```

   访问：`http://localhost:4000/api/health`（健康），`/docs`（Swagger，仅开发/预发） ，pgAdmin：`http://localhost:5050`

---

## 目录结构（复制即可）

```
├─ compose.yml                     # 根：Compose 栈定义
└─ apps/
   └─ api/
      ├─ Dockerfile                # API 镜像（多阶段构建）
      ├─ docker/
      │  └─ entrypoint.sh          # 启动时自动 migrate deploy
      ├─ prisma/                   # Prisma schema 与 migrations（你已有）
      └─ .env.docker               # 容器用环境变量
```

> 说明：本镜像在容器内仅构建 **api 子项目**，不依赖 monorepo 其他包在运行时可用。若你的 `api` **运行时**引用了 `@lucky/shared` 的 JS 产物，请看文末「**Monorepo 运行时依赖说明**」。

---

## compose.yml（根目录，完整复制）

```yaml
version: "3.9"

services:
  db:
    image: postgres:16
    container_name: lucky_db
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev"]
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: lucky_api
    env_file:
      - apps/api/.env.docker
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "4000:4000"
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:4000/api/health"]
      interval: 10s
      timeout: 3s
      retries: 10

  pgadmin:
    image: dpage/pgadmin4:8
    container_name: lucky_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "5050:80"
    depends_on:
      - db

volumes:
  db_data:
```

---

## apps/api/Dockerfile（完整复制）

```dockerfile
# ========= build stage =========
FROM node:20-alpine AS builder
WORKDIR /app

# 仅复制 api 包所需文件（最强缓存）：
COPY apps/api/package.json apps/api/yarn.lock ./
COPY apps/api/tsconfig*.json apps/api/nest-cli.json ./
COPY apps/api/prisma ./prisma

# 安装依赖（此处以 yarn 为例；如你用 npm，请替换为 npm ci）
RUN corepack enable \
 && corepack prepare yarn@4.4.0 --activate \
 && yarn install --frozen-lockfile

# 复制源码并构建
COPY apps/api/src ./src
RUN yarn build

# 生成 Prisma Client（与 schema 绑定）
RUN npx prisma generate

# ========= runtime stage =========
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 仅带运行时必要产物
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY apps/api/package.json ./
COPY apps/api/docker/entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh
EXPOSE 4000
CMD ["./entrypoint.sh"]
```

> 如你更习惯 npm，把 `yarn install`/`yarn build` 改为 `npm ci`/`npm run build` 即可。

---

## apps/api/docker/entrypoint.sh（完整复制）

```bash
#!/usr/bin/env sh
set -e

# 1) 生产安全：仅应用已存在的迁移
npx prisma migrate deploy

# 2) 可选：仅在需要时执行种子（通过 env 控制）
if [ "$SEED" = "true" ]; then
  echo "Running seed..."
  npx prisma db seed
fi

# 3) 启动服务
node dist/main.js
```

> 如果你的 seed 脚本依赖 TypeScript，确保在 `package.json` 的 `"prisma": { "seed": "node prisma/seed.js" }` 指向 JS 版本；或在镜像里安装 `ts-node` 并调用 `ts-node`。

---

## apps/api/.env.docker（完整复制后按需修改）

```dotenv
NODE_ENV=production
HOST=0.0.0.0
PORT=4000
CORS_ORIGIN=http://localhost:3000

# 关键：容器内连接 db 服务，不是 localhost
DATABASE_URL=postgresql://dev:dev@db:5432/app

# JWT
JWT_SECRET=please_change_me_very_secret
JWT_EXPIRES_IN=15m

# 可选：启动时执行 seed（仅开发/预发建议开启）
SEED=false
```

---

## 启动 / 停止 / 日志（可复制）

```bash
# 首次或有变更：构建并后台启动
docker compose up -d --build

# 查看容器状态
docker compose ps

# 跟随日志（API / DB）
docker compose logs -f api
docker compose logs -f db

# 访问健康检查 / Swagger
# http://localhost:4000/api/health
# http://localhost:4000/docs  (生产请关闭或加鉴权)

# 停止（保留数据卷）
docker compose down
# 停止并清理数据卷（不可逆）
docker compose down -v
```

---

## 数据库迁移与种子（稳定流程）

### 本地开发（非容器）

```bash
# 修改 schema.prisma 后生成迁移
yarn dlx prisma migrate dev --name <change_name>

# 生成 Prisma Client（可选，一般 migrate 会自动触发）
yarn dlx prisma generate

# 种子（如 package.json 已配置 prisma.seed）
yarn dlx prisma db seed
```

> 把 `prisma/migrations/*` 提交到 Git。容器启动会自动 `migrate deploy`。

### 生产/容器

* `entrypoint.sh` 已在启动时执行 `npx prisma migrate deploy`（幂等）；
* 如需执行种子，将 `apps/api/.env.docker` 中 `SEED=true`（仅建议在开发/预发）。

---

## pgAdmin 快速使用

1. 打开 [http://localhost:5050](http://localhost:5050)（默认：`admin@example.com` / `admin123`）。
2. Add New Server → 连接参数：

    * **Name**: `local-db`
    * **Host**: `db`
    * **Port**: `5432`
    * **Username**: `dev`
    * **Password**: `dev`

---

## 常见问题速查（复制即查）

### Prisma P1001：无法连接数据库

* `DATABASE_URL` 里的主机应为 `db`（不是 `localhost`）。
* 查看 DB 容器：`docker compose logs -f db`，等待 `ready to accept connections`。
* Compose 里 `depends_on.db.condition=service_healthy` 是否存在。

### 健康检查失败（API）

* 确认你的应用有 `GET /api/health` 路由；
* 如端口修改，更新 compose 的 `"4000:4000"` 映射与健康检查 URL。

### 迁移未执行

* 看 API 日志中是否出现 `prisma migrate deploy`；
* 确认 `Dockerfile` 有 `COPY apps/api/prisma ./prisma`；
* 确认迁移文件已提交到仓库。

### 端口占用

* 修改 `compose.yml` 中的端口映射，例如：`"4100:4000"`、`"55432:5432"`。

### pgAdmin 连接失败

* Host 一定填 `db`；若仍失败，查看 `db` 容器日志和健康状态。

---

## 生产加固（上线前必做）

* **关闭或保护 Swagger**：生产环境禁用 `/docs` 或加 Basic Auth，仅内网可访问。
* **JWT**：使用强随机 `JWT_SECRET`，合理设置 `JWT_EXPIRES_IN`；考虑加入 Refresh Token 旋转/失效管理。
* **CORS**：严格白名单，多域用逗号分隔；不要在 `credentials:true` 下使用 `*`。
* **TLS**：通过反向代理（Nginx/Ingress/Cloudflare）终止 TLS；容器仅暴露内网端口。
* **日志**：输出结构化 JSON；为探针准备 `/api/health`（liveness/readiness）。
* **数据库**：只暴露内网；启用自动备份；必要时使用连接池（pgBouncer）。

---

## CI/CD 备注（可复制脚本）

```bash
# 构建并推送镜像（以根为上下文）
docker build -t your-registry/lucky-api:$(git rev-parse --short HEAD) -f apps/api/Dockerfile .
docker push your-registry/lucky-api:$(git rev-parse --short HEAD)

# 服务器滚动更新 API（保留 DB）
docker compose pull api
docker compose up -d --no-deps --build api
```

> 因为 `entrypoint.sh` 内置 `migrate deploy`，每次滚动更新都会自动执行未应用迁移。若希望在 CI 中**先行**迁移，可在部署前远程执行 `npx prisma migrate deploy`。

---

## Monorepo 运行时依赖说明（如有 @lucky/shared 运行时代码）

* 本 Dockerfile 默认假设 `@lucky/shared` **仅用于类型**（编译期）。
* 若 `api` 在运行时也需要它：

    1. 在 Dockerfile 的 build 阶段 `COPY packages/shared ./packages/shared`；
    2. 在构建命令前执行 **工作区聚焦安装**（Yarn）：

       ```bash
       corepack enable && corepack prepare yarn@4.4.0 --activate \
         && yarn workspaces focus @lucky/api --production
       ```
    3. 或者将 `@lucky/shared` 预编译为 JS 并发布到私有 npm，然后在 `apps/api/package.json` 直接依赖它的版本号。

---

