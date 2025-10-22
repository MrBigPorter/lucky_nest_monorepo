# ========= build stage 构建阶段：装依赖 + 构建=========
FROM node:20-alpine AS builder
WORKDIR /work

# 1) 拷“仓库根”的 Yarn 文件（monorepo 关键）
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ ./.yarn/

# 2) 只拷 api 的 package.json（最大化缓存）
COPY apps/api/package.json apps/api/package.json

# 3) 为 @lucky/api 安装依赖（Yarn 4，无需插件导入、无需 production 参数）
RUN corepack enable \
 && corepack prepare yarn@4.9.2 --activate \
 && yarn workspaces focus @lucky/api

# 4) 现在再拷源码
COPY apps/api/ apps/api/

# 5) 构建 & 生成 Prisma Client  # 新增：裁剪为生产依赖
RUN yarn workspace @lucky/api build \
 && yarn workspace @lucky/api dlx prisma generate \
 && yarn workspaces focus @lucky/api --production

# ========= runtime stage =========
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 给 npx 用的 prisma CLI（避免启动时临时联网安装）
RUN npm i -g prisma@6.17.1

# 仅拷运行时必要产物 先产出 dist/ 和 Prisma Client。
COPY --from=builder /work/node_modules ./node_modules
COPY --from=builder /work/apps/api/dist ./dist
COPY --from=builder /work/apps/api/prisma ./prisma
COPY --from=builder /work/apps/api/package.json ./package.json
COPY apps/api/docker/entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh
EXPOSE 4000
CMD ["./entrypoint.sh"]