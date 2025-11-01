1) 第一次初始化（空库或可清空的开发库）
# 生成 Client（类型）
docker exec -it lucky-backend-dev sh -lc "cd apps/api && yarn prisma generate --schema prisma/schema.prisma"

# 创建并应用首个迁移（把 schema 真正写进数据库）
docker exec -it lucky-backend-dev sh -lc "cd apps/api && yarn prisma migrate dev --name init --schema prisma/schema.prisma"

# 验证模型代理是否存在（应包含 treasure 等）
docker exec -it lucky-
backend-dev sh -lc 'cd apps/api && node -e "const {PrismaClient}=require(\"@prisma/client\");const p=new PrismaClient();console.log(Object.keys(p).filter(k=>typeof p[k]?.findMany===\"function\"))"'

2) 日常开发（改表、加字段、索引）

每次修改 schema.prisma 后只需要：

# 写完 schema 之后：
docker exec -it lucky-backend-dev sh -lc "cd apps/api && yarn prisma migrate dev --name <你的变更名> --schema prisma/schema.prisma && yarn prisma generate --schema prisma/schema.prisma"

3) 上线/CI（只执行已存在的迁移）
# 部署环境（不可用 db push）
docker exec -it lucky-backend-dev sh -lc "cd apps/api && yarn prisma migrate deploy --schema prisma/schema.prisma && yarn prisma generate --schema prisma/schema.prisma"

4) 故障恢复 & 常见场景

A) 开发库重置（可清空）
docker exec -it lucky-backend-dev sh -lc "cd apps/api && yarn prisma migrate reset --force --skip-seed --schema prisma/schema.prisma && yarn prisma migrate dev --name init --schema prisma/schema.prisma && yarn prisma generate --schema prisma/schema.prisma"

B) 线上/已有数据接入（基线迁移，不动现有数据）

当库里已有表，但 migrations/ 为空或不一致时用。

docker exec -it lucky-backend-dev sh -lc "
cd apps/api && mkdir -p prisma/migrations/BASELINE && \
yarn prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/BASELINE/migration.sql && \
yarn prisma migrate resolve --applied BASELINE --schema prisma/schema.prisma && \
yarn prisma migrate status --schema prisma/schema.prisma
"

C) 快速体检（碰到“模型找不到/红线”时就跑）

# 1) 客户端指向的物理路径（看是不是 apps/api 下那份）
docker exec -it lucky-backend-dev sh -lc "cd apps/api && node -p \"require.resolve('@prisma/client/package.json')\""

# 2) 重新生成 client
docker exec -it lucky-backend-dev sh -lc "cd apps/api && yarn prisma generate --schema prisma/schema.prisma"

# 3) 列出模型代理（必须看到 treasure）
docker exec -it lucky-backend-dev sh -lc 'cd apps/api && node -e "const {PrismaClient}=require(\"@prisma/client\");const p=new PrismaClient();console.log(Object.keys(p).filter(k=>typeof p[k]?.findMany===\"function\"))"'

只背这四条（超浓缩 Cheat Sheet）
1.	生成类型
prisma generate
2.	开发改表
prisma migrate dev --name <变更>
3.	部署执行
prisma migrate deploy
4.	开发重置
prisma migrate reset --force --skip-seed

全部都在容器里、cd apps/api、带 --schema prisma/schema.prisma。