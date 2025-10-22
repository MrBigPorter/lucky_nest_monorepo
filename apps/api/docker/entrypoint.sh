#!/bin/sh
set -e

echo "→ Prisma generate (runtime)"
npx prisma generate

echo "→ Prisma migrate deploy"
npx prisma migrate deploy

echo "→ Start Nest"
node dist/main.js