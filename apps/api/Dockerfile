# ========= build stage =========
FROM node:20-alpine AS builder
WORKDIR /app

# 仅拷贝依赖清单以最大化缓存利用
COPY apps/api/package.json apps/api/yarn.lock ./
COPY apps/api/tsconfig*.json apps/api/nest-cli.json ./
COPY apps/api/prisma ./prisma
RUN yarn install --frozen-lockfile

# 拷贝源码并构建
COPY apps/api/src ./src
RUN yarn build
# 生成 Prisma Client（与 schema 绑定）
RUN npx prisma generate

# ========= runtime stage =========
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 只带运行所需产物
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY apps/api/package.json ./
COPY apps/api/docker/entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh
EXPOSE 4000
CMD ["./entrypoint.sh"]