#!/usr/bin/env sh
set -e

# 1) 应用所有未执行的迁移（生产安全姿势）
npx prisma migrate deploy

# 2) 可选：仅在非生产做种子
if [ "$SEED" = "true" ]; then
  echo "Running seed..."
  npx prisma db seed
fi

# 3) 启动 Nest
node dist/main.js