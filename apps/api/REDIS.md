# 总键数

docker exec -it lucky-redis sh -lc 'redis-cli -a "$REDIS_PASSWORD" DBSIZE'

# 扫描相关键（你现在前缀是 lucky:）

docker exec -it lucky-redis sh -lc 'redis-cli -a "$REDIS*PASSWORD" --scan --pattern "lucky::\_banners*" | head'

# 看某个键的剩余寿命（毫秒）

docker exec -it lucky-redis sh -lc 'redis-cli -a "$REDIS_PASSWORD" PTTL "lucky::/api/v1/banners?bannerCate=1&position=0&state=1&validState=1&limit=10"'

# 预期 ≈ 300000 且递减（因为 TTL 用毫秒）

    •	返回 ≈ 300000 且递减 → OK（TTL 是 5 分钟，单位毫秒）
    •	返回 -2 → 说明 key 不存在（刚才没写到这个 key、或者你查错 key）
    •	返回 -1 → 有这个 key，但没设置过期（一般不该这样）

# 删除某个键（立即失效）

redis-cli -a "$REDIS_PASSWORD" DEL "lucky::v1|GET|/api/v1/banners?bannerCate=1&limit=10&position=0&state=1&validState=1|en|h5"

# 请求侧绕过缓存（调试）

curl -s -D - -H 'x-locale: en' -H 'x-platform: h5' \
'http://localhost:3000/api/v1/banners?bannerCate=1&limit=10&position=0&state=1&validState=1&\_\_nocache=1' -o /dev/null

# 看容器内 REDIS_URL / DATABASE_URL 等

docker exec -it lucky-backend-dev sh -lc 'echo "$REDIS_URL"; echo "$DATABASE_URL"'

# PING 一下 redis（不装 redis-cli 也行）

docker exec -it lucky-backend-dev node -e 'const {createClient}=require("redis");(async()=>{const c=createClient({url:process.env.REDIS_URL});await c.connect();console.log("PING =>",await c.ping());await c.quit();})()'
