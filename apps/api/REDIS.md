# 总键数
docker exec -it lucky-redis sh -lc 'redis-cli -a "$REDIS_PASSWORD" DBSIZE'

# 扫描相关键（你现在前缀是 lucky:）
docker exec -it lucky-redis sh -lc 'redis-cli -a "$REDIS_PASSWORD" --scan --pattern "lucky::*banners*" | head'

# 看某个键的剩余寿命（毫秒）
docker exec -it lucky-redis sh -lc 'redis-cli -a "$REDIS_PASSWORD" PTTL "lucky::/api/v1/banners?bannerCate=1&position=0&state=1&validState=1&limit=10"'
# 预期 ≈ 300000 且递减（因为 TTL 用毫秒）

# 看容器内 REDIS_URL / DATABASE_URL 等
docker exec -it lucky-backend-dev sh -lc 'echo "$REDIS_URL"; echo "$DATABASE_URL"'
# PING 一下 redis（不装 redis-cli 也行）
docker exec -it lucky-backend-dev node -e 'const {createClient}=require("redis");(async()=>{const c=createClient({url:process.env.REDIS_URL});await c.connect();console.log("PING =>",await c.ping());await c.quit();})()'