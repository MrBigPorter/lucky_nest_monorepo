# Deploy 配置说明

## 目录结构

```
deploy/
├── .env.example    # 模板 (提交到 Git)
├── .env.dev        # 开发环境变量 (不提交)
└── .env.prod       # 生产环境变量 (不提交)
```

## 快速上手

### 1. 首次配置

```bash
# 复制模板并填写实际值
cp deploy/.env.example deploy/.env.dev
cp deploy/.env.example deploy/.env.prod
# 编辑文件填入对应环境的密钥...
```

### 2. 开发环境

```bash
# 启动 (构建 base 镜像 + api + admin + nginx + db + redis)
yarn docker:up

# 查看日志
yarn docker:logs

# 停止
yarn docker:down
```

### 3. 生产环境

```bash
# 启动 (多阶段构建，镜像更小)
yarn docker:prod

# 查看日志
yarn docker:prod:logs

# 停止
yarn docker:prod:down
```

### 4. Prisma 命令 (在开发容器内执行)

```bash
yarn pr:m:dev       # 创建新迁移
yarn pr:m:deploy    # 部署迁移
yarn pr:m:status    # 查看迁移状态
yarn pr:m:reset     # 重置数据库
yarn pr:gen         # 重新生成 Prisma Client
yarn pr:studio      # 打开 Prisma Studio (端口 5555)
```

## 架构说明

### Dev 模式
- `Dockerfile.base` → 预装依赖的基础镜像
- `apps/api/Dockerfile.dev` → 继承 base，通过 volume 挂载源码
- `apps/mini-shop-admin/Dockerfile.dev` → 同上
- 源码改动实时热更新，不需要重建镜像

### Prod 模式
- `Dockerfile.prod` → 多阶段构建
  - Stage 1 (builder): 安装依赖 + 编译 (包含 python3/make/g++)
  - Stage 2 (production): 只复制运行时文件 (只有 openssl)
- 最终镜像约 400-600MB (vs 之前的 2-3GB)

## ENV 变量说明

所有环境变量集中在一个文件中，分为以下几组：

| 分组 | 变量前缀 | 用途 |
|------|----------|------|
| 基础设施 | `POSTGRES_*`, `REDIS_*` | Compose 插值 + 容器内连接 |
| API 连接 | `DATABASE_URL`, `REDIS_URL` | Prisma / Redis 客户端直连 |
| 安全 | `JWT_*`, `OTP_*` | 认证鉴权 |
| 存储 | `CF_R2_*`, `R2_*` | Cloudflare R2 文件上传 |
| 支付 | `XENDIT_*` | Xendit 支付网关 |
| 云服务 | `AWS_*`, `GOOGLE_*`, `FIREBASE_*` | KYC / 推送 / 地图 |
| 通信 | `TURN_*` | WebRTC TURN 服务器 |

