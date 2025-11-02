直接用 yarn dlx 临时下载并运行 tsx：
说明：yarn dlx 会临时下载 tsx，用完即丢，不污染依赖。

# 分类
docker exec -it lucky-backend-dev sh -lc \
"cd apps/api && yarn dlx tsx  scripts/seed/product-category-list.ts"

# 商品
docker exec -it lucky-backend-dev sh -lc \
"cd apps/api && yarn dlx tsx  scripts/seed/seed-treasures.ts"

# 关联（商品-分类）
docker exec -it lucky-backend-dev sh -lc \
'cd apps/api && yarn dlx tsx scripts/seed/link-treasure-categories.ts'

# 首页banner
docker exec -it lucky-backend-dev sh -lc \
'cd apps/api && yarn dlx tsx scripts/seed/seed-banners.ts'

# 首页广告
docker exec -it lucky-backend-dev sh -lc \
'cd apps/api && yarn dlx tsx scripts/seed/seed-ads.ts'