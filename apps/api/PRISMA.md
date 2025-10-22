# 1) 安装
yarn add -D prisma
yarn add @prisma/client

# 编辑 prisma/schema.prisma（示例）

```
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  nickname  String?
  createdAt DateTime @default(now())
}
```

# 2) 初始化（生成 prisma/schema.prisma 与 .env）
npx prisma init

# 本地开发：生成并应用迁移（会在 DB 建表） 开发环境需要描述，生产不需要
npx prisma migrate dev --name <描述>

# 生产/CI：只应用已有迁移（不会生成新文件）
npx prisma migrate deploy

# 快速把模型推到库（不保留历史，别在生产用）
npx prisma db push

# 重新初始化开发库（危险：会 DROP 重建）
npx prisma migrate reset

# 生成 Prisma Client（每次改模型后都要）
npx prisma generate

# （美化）
yarn workspace @lucky/api dlx prisma format
# 提前发现语法/结构错误
yarn workspace @lucky/api dlx prisma validate
yarn workspace @lucky/api dlx prisma migrate dev -n fix_fk_setnull

# 可选：填充种子数据

npx prisma db seed

# 快速自检（现在就能做）
# 1) API 健康
curl -s http://localhost:4000/api/health

# 2) DB 连通
docker compose exec db psql -U dev -d app -c "\dt"