#!/bin/sh
set -e

# 仅在 RUN_MIGRATIONS=true 时执行迁移 (首次部署或手动触发)
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "→ Prisma migrate deploy"
  ./apps/api/node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma
fi

echo "→ Start Nest"
node apps/api/dist/main.js
