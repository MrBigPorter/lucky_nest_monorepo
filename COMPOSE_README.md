# Docker Compose 使用说明（API + Postgres + pgAdmin）

> 适用对象：**第一次上手 Docker/Compose 的前端/全栈**。配套示例：**后端 API（Nest/Node）+ Postgres + pgAdmin**。文档尽量“可抄可跑”。

---

## 目录

1. 什么是 Docker Compose（一句话心智）
2. 快速开始（10 分钟跑通）
3. 关键概念与 5 字口诀 **P‑E‑N‑V‑H**
4. 示例工程结构 & `.env` 文件
5. Compose 文件（可运行版 + 行内注释版）
6. 常用命令清单（启动、日志、进入容器、清理）
7. 健康检查 & 启动顺序（`depends_on` vs `healthcheck`）
8. 网络、端口与“服务名当主机名”
9. 数据持久化：卷（volumes）与备份/恢复
10. 典型变体（开发 / 生产 / 云数据库 / 关闭 pgAdmin）
11. 故障排查（FAQ）
12. 安全与最佳实践

---

## 1) 什么是 Docker Compose（一句话心智）

**Compose = 一张清单 + 一个开关**。

- 清单（`docker-compose.yml`）里写：要起哪些服务（API、DB、pgAdmin）、端口、环境变量、数据卷、健康检查、依赖顺序……
- 开关：`docker compose up -d` 一把全开，`docker compose down` 一把全关。

> 记忆：**“把一整套服务起好、连好、配好”**。

---

## 2) 快速开始（10 分钟跑通）

**前置**：安装 Docker Desktop（或 Docker Engine + Compose 插件）。

**步骤**：

1. 在项目根目录准备以下文件：
   - `docker-compose.yml`（见下文）
   - `apps/api/.env.docker`（API 的环境变量）

2. 确认本机 **5432/4000/5050** 端口未被占用（Postgres/API/pgAdmin）。如占用，可改 Compose 中的宿主端口。
3. 启动：

   ```bash
   docker compose up -d
   docker compose ps               # 查看状态/健康
   docker compose logs -f api      # 观察 API 日志
   ```

4. 验证：
   - 打开 `http://localhost:5050`（pgAdmin 登录：`admin@example.com` / `admin123`）。
   - pgAdmin 新建 Server：Host 填 **`db`**，Port `5432`，User/Pass **`dev/dev`**。
   - 打开 `http://localhost:4000/api/health`（你的 API 健康路由，需在代码里实现）。

5. 停止：

   ```bash
   docker compose down             # 停止但保留数据
   # 或 docker compose down -v     # 连同数据库卷一起清理（谨慎）
   ```

---

## 3) 关键概念与 5 字口诀 **P‑E‑N‑V‑H**

- **P = Ports**（端口映射）：`"宿主:容器"`，用于对外访问（例如 `4000:4000`）。
- **E = Env**（环境变量）：`environment:` / `env_file:` 将配置注入容器（例如 `DATABASE_URL`）。
- **N = Network**（网络）：Compose 自动建默认网络；容器间用**服务名当主机名**（`db:5432`）。
- **V = Volumes**（卷）：把数据库文件放进“抽屉”，容器删了数据还在（例如 `db_data:`）。
- **H = Healthcheck**（健康检查）：教容器如何判断“我准备好了”；配合 `depends_on: condition: service_healthy` 实现“**等 DB 好了再起 API**”。

---

## 4) 示例工程结构 & `.env` 文件

```
project-root/
├─ docker-compose.yml
└─ apps/
   └─ api/
      ├─ .env.docker            # API 的环境变量（本地开发）
      └─ Dockerfile             # API 构建镜像使用
```

**`apps/api/.env.docker`（示例）**

```dotenv
# 容器内互联，用服务名 db 当主机名
DATABASE_URL="postgresql://dev:dev@db:5432/app?schema=public"

# 你的服务需要的其它配置（示例）
NODE_ENV=production
JWT_SECRET=change-me
PORT=4000
```

> `.env.docker` 通常加入 `.gitignore`，避免把敏感信息提交到 Git。

---

## 5) Compose 文件

### 5.1 可运行版（直接可用）

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
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
    restart: unless-stopped
    container_name: lucky_api
    env_file:
      - apps/api/.env.docker
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "4000:4000"
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "wget -qO- http://localhost:4000/api/health >/dev/null 2>&1 || exit 1",
        ]
      interval: 10s
      timeout: 3s
      retries: 10

  pgadmin:
    image: dpage/pgadmin4:8
    restart: unless-stopped
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

### 5.2 行内注释版（看一眼就懂）

```yaml
services:
  db: # ← 数据库（Postgres）
    image: postgres:16 # 官方镜像
    restart: unless-stopped # 意外退出自动拉起
    container_name: lucky_db
    environment: # 首次启动初始化账号/库
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: app
    ports:
      - "5432:5432" # 宿主 5432 → 容器 5432（本机客户端可连）
    volumes:
      - db_data:/var/lib/postgresql/data # 数据持久化到命名卷
    healthcheck: # DB 就绪判定（绿灯）
      test: ["CMD-SHELL", "pg_isready -U dev"]
      interval: 5s
      timeout: 3s
      retries: 10

  api: # ← 你的后端 API（Nest/Node）
    build: # 从源码构建镜像（也可改成 image: myapp:tag）
      context: . # 构建上下文（仓库根）
      dockerfile: apps/api/Dockerfile # Dockerfile 路径
    restart: unless-stopped
    container_name: lucky_api
    env_file:
      - apps/api/.env.docker # 批量注入环境变量（如 DATABASE_URL）
    depends_on:
      db:
        condition: service_healthy # 等 DB 绿灯再启动 API
    ports:
      - "4000:4000" # 本机访问 http://localhost:4000
    healthcheck: # API 自己的健康检查
      test:
        [
          "CMD-SHELL",
          "wget -qO- http://localhost:4000/api/health >/dev/null 2>&1 || exit 1",
        ]
      interval: 10s
      timeout: 3s
      retries: 10

  pgadmin: # ← 数据库的 Web 管理 UI
    image: dpage/pgadmin4:8
    restart: unless-stopped
    container_name: lucky_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com # 登录 pgAdmin 的账号
      PGADMIN_DEFAULT_PASSWORD: admin123 # 登录 pgAdmin 的密码
    ports:
      - "5050:80" # 浏览器访问 http://localhost:5050
    depends_on:
      - db # 先起 DB 再起 pgAdmin

volumes:
  db_data: # 声明命名卷（数据库“抽屉”）
```

---

## 6) 常用命令清单

```bash
# 启动 / 停止
docker compose up -d
docker compose down                      # 停止但保留卷

# 查看状态 / 健康
docker compose ps

# 看日志（-f 持续）
docker compose logs -f api

# 进入容器（交互）
docker compose exec api sh

# 查看卷 & 细节
docker volume ls
docker volume inspect <工程名>_db_data

# 清理（谨慎）
docker compose down -v                   # 删容器+网络+卷（数据清零）
```

---

## 7) 健康检查 & 启动顺序

- **`depends_on` 只排队**：先开谁再开谁；**不等准备好**。
- **真等准备好 → 必须配 `healthcheck`**：
  - 在 `db` 上定义 `healthcheck`（`pg_isready` 返回 0）。
  - 在 `api` 上写：

    ```yaml
    depends_on:
      db:
        condition: service_healthy
    ```

- **双保险**（推荐）：在 API 的 `entrypoint.sh` 里也 `nc -z db 5432` 等端口通，再启动。

---

## 8) 网络、端口与“服务名当主机名”

- Compose 默认创建一个桥接网络，`db`、`api`、`pgadmin` 都在里边。
- **容器间访问**：`api` 连接数据库用 `db:5432`（**服务名**就是**主机名**）。
- **对外访问**：用 `ports: "宿主:容器"` 暴露（如 `4000:4000`）。
- **常见坑**：在容器里写 `localhost:5432` 会连到自己，而不是 `db`。

---

## 9) 数据持久化：卷（volumes）与备份/恢复

- **为什么要卷**：容器删了/重建，数据不丢（数据库、上传文件等）。
- **命名卷**：`db_data:/var/lib/postgresql/data`。
- **备份/恢复（Postgres）**：

  ```bash
  # 备份（在宿主机执行；导出到当前目录）
  docker compose exec db pg_dump -U dev -d app -F c -f /tmp/app.dump
  docker cp lucky_db:/tmp/app.dump ./app.dump

  # 恢复（创建空库后）
  docker cp ./app.dump lucky_db:/tmp/app.dump
  docker compose exec db pg_restore -U dev -d app /tmp/app.dump
  ```

---

## 10) 典型变体

- **开发最小集**（API + DB，无 pgAdmin）：删掉 `pgadmin` 服务即可。
- **生产常见**：外面放反向代理（Traefik/Nginx），API 不对外映射端口（用 `expose:`），数据库改成云服务（RDS/Neon）。
- **云数据库**：删除 `db` 服务；在 API 的 `env_file` 里把 `DATABASE_URL` 指向云端；保留 `ports: "4000:4000"`。
- **改宿主端口**：例如本机已有 Postgres 占 5432，可写 `"5433:5432"`。
- **按需启用**：用 `profiles`/`docker compose --profile` 控制是否启动 pgAdmin 等。

---

## 11) 故障排查（FAQ）

- **API 报数据库连接错**：
  1. `DATABASE_URL` 的主机名必须是 `db`；
  2. `db` 是否 `healthy`；
  3. API 入口脚本里加 `until nc -z db 5432; do sleep 1; done`。

- **端口冲突**：`bind: address already in use` → 改 `ports` 左边宿主端口（如 `5433:5432`）。
- **pgAdmin 登录不了数据库**：在 pgAdmin 里新建 Server 时 Host 填 `db`，不是 `localhost`。
- **环境变量没生效**：
  - `docker compose exec api env | grep DATABASE_URL`；
  - 覆盖优先级：`-e` > `environment:` > `env_file:` > 镜像 `ENV`。

- **容器一直 `unhealthy`**：
  - 检查健康路由/命令是否返回 0；
  - 增大 `interval/retries/start_period`。

- **数据丢失**：是否用了 `down -v`；确认使用了命名卷 `db_data`。

---

## 12) 安全与最佳实践

- **不要把密钥写进 Git**：用 `env_file`（在 `.gitignore`），生产用秘密管理/云参数服务。
- **只暴露必要端口**：生产中 API 通常仅被反代访问，数据库不对公网开放。
- **最小镜像与只读根 FS**（高级）：Runtime 镜像基于 `node:alpine`，可配 `read_only: true`（配合正确的写路径）。
- **使用非 root 运行**（镜像支持时）：`user: node`。
- **定期备份数据库**：建立 `pg_dump` 定时任务。

---

### 附：速查卡（打印贴旁边）

- **启动/停止**：`up -d` / `down` / `down -v`
- **看状态**：`docker compose ps`
- **看日志**：`docker compose logs -f api`
- **进入容器**：`docker compose exec api sh`
- **口诀**：**P‑E‑N‑V‑H**（Ports / Env / Network / Volumes / Health）
- **容器间访问**：**服务名=主机名**（`db:5432`）
- **等健康再起**：`depends_on: condition: service_healthy` + `healthcheck`
