# 分类
docker exec -it lucky-backend-dev sh -lc "\
cd /app && \
yarn workspace @lucky/api dlx tsx scripts/seed/product-category-list.ts"

# 商品
docker exec -it lucky-backend-dev sh -lc "\
cd /app && \
yarn workspace @lucky/api dlx tsx scripts/seed/seed-treasures.ts"

# 关联（商品-分类）
docker exec -it lucky-backend-dev sh -lc "\
cd /app && \
yarn workspace @lucky/api dlx tsx scripts/seed/link-treasure-categories.ts"

# 首页 banner
docker exec -it lucky-backend-dev sh -lc "\
cd /app && \
yarn workspace @lucky/api dlx tsx scripts/seed/seed-banners.ts"

# 首页广告
docker exec -it lucky-backend-dev sh -lc "\
cd /app && \
yarn workspace @lucky/api dlx tsx scripts/seed/seed-ads.ts"

# actSections
docker exec -it lucky-backend-dev sh -lc "\
cd /app && \
yarn workspace @lucky/api dlx tsx scripts/seed/seed-sections.ts"

# exchange rates
docker exec -it lucky-backend-dev \
sh -lc "cd apps/api && yarn dlx tsx scripts/seed/system-config-exchange-rate.ts"

# 钱包
docker exec -it lucky-backend-dev sh -lc "\
cd /app && \
yarn workspace @lucky/api dlx tsx scripts/seed/seed-wallet.ts"