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

export const GROUP_CACHE_KEYS = {
  // 1. 缓存前缀 (Namespace)
  PREFIX: 'group:v1',

  // 2. 团购列表缓存 (用于商品详情页展示 "正在拼团")
  // 结构: group:v1:list:treasure:{treasureId}:page:{page}
  // 策略: TTL 较短 (如 5-10秒)，保证实时性，或者由成团动作主动失效
  LIST_FOR_TREASURE: (treasureId: string, page: number = 1) =>
    `group:v1:list:treasure:${treasureId}:p:${page}`,

  // 3. 团购详情缓存 (用于分享页/详情页高频读取)
  // 结构: group:v1:detail:{groupId}
  // 策略: 每次 join/create/success/fail 时需要主动 del 删除此 Key
  DETAIL: (groupId: string) => `group:v1:detail:${groupId}`,

  // 4. 团成员列表缓存 (详情页下方的头像列表)
  // 结构: group:v1:members:{groupId}
  MEMBERS: (groupId: string) => `group:v1:members:${groupId}`,

  // 5. 分布式锁 Key 模板 (配合 @DistributedLock)
  // 用于 Cron 任务防止多实例重复执行
  LOCK_CRON_EXPIRE: 'lock:cron:group:expire',

  // 用于防止同一个用户针对同一个团并发操作 (可选，数据库乐观锁其实已经够了)
  LOCK_JOIN: 'lock:group:join:{0.groupId}:{0.userId}',
};
