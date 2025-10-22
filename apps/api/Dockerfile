# ========= build stage =========
FROM node:20-alpine AS builder
WORKDIR /work

# Yarn 4 + monorepo 基础文件
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ ./.yarn/
# 只拷 api 的 package.json 以利用缓存
COPY apps/api/package.json apps/api/package.json

RUN corepack enable \
 && corepack prepare yarn@4.9.2 --activate \
 && yarn config set nodeLinker node-modules \
 && YARN_ENABLE_IMMUTABLE_INSTALLS=0 yarn install \
 && yarn workspaces focus @lucky/api

# 拷源码
COPY apps/api/ apps/api/

# 生成 Prisma Client -> 构建 Nest
RUN yarn workspace @lucky/api exec prisma generate \
 && yarn workspace @lucky/api build

# ========= runtime stage =========
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /work/node_modules ./node_modules
COPY --from=builder /work/apps/api/dist ./dist
COPY --from=builder /work/apps/api/prisma ./prisma
COPY --from=builder /work/apps/api/package.json ./package.json
COPY apps/api/docker/entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh
EXPOSE 4000
CMD ["./entrypoint.sh"]