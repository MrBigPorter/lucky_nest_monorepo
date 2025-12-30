export const HOME_CACHE_KEYS = {
  // 1. 缓存前缀 (用于统计或全局清理)
  HOME_PREFIX: 'home:sections:v1',

  // 2. 首页楼层查询模式 (用于 Redis KEYS/SCAN 命令)
  HOME_SECTIONS_PATTERN: 'home:sections:v1:limit:*',

  // 3. 生成具体的首页数据 Key (用于 GET/SET)
  HOME_SECTIONS: (limit: number | string) => `home:sections:v1:limit:${limit}`,

  // 4. 商品详情缓存 (用于移动端详情页)
  PRODUCT_DETAIL: (id: string) => `product:detail:v1:${id}`,

  // 5. 分布式锁 Key 模板 (用于 @DistributedLock 装饰器)
  // 注意：装饰器里通常使用 '{0}' 这种占位符，所以直接提供字符串
  LOCK_HOME_SECTIONS_TPL: 'lock:home-sections:v1:limit:{0}',
};
