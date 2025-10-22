# 开发期：创建并应用迁移（会改本地开发库）
npx prisma migrate dev --name <描述>

# 生产/CI：只应用已有迁移（不会生成新文件）
npx prisma migrate deploy

# 快速把模型推到库（不保留历史，别在生产用）
npx prisma db push

# 重新初始化开发库（危险：会 DROP 重建）
npx prisma migrate reset

# 生成 Prisma Client（改模型后需要）
npx prisma generate

# 可选：填充种子数据

npx prisma db seed

# 快速自检（现在就能做）
# 1) API 健康
curl -s http://localhost:4000/api/health

# 2) DB 连通
docker compose exec db psql -U dev -d app -c "\dt"