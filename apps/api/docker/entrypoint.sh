#!/bin/sh
set -e

# 如果传入了命令参数，直接执行 (供 init-db.sh / CI 调用 prisma)
# 例: docker run ... image ./apps/api/node_modules/.bin/prisma migrate deploy ...
if [ $# -gt 0 ]; then
  exec "$@"
fi

# 仅在 RUN_MIGRATIONS=true 时执行迁移 (首次部署或手动触发)
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "→ Prisma migrate deploy"
  ./apps/api/node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma
fi

echo "→ Start Nest"
node apps/api/dist/main.js
