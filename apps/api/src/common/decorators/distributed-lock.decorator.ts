/**
 * 分布式锁装饰器
 * @param keyPattern 锁 Key 模板
 * @param ttl 超时时间
 * @param throwOnFail 抢不到锁是否报错？Cron 填 false，API 填 true (默认)
 */
export function DistributedLock(
  keyPattern: string,
  ttl: number = 10000,
  throwOnFail: boolean = true,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      // 关键点：装饰器默认去找名为 'lockService' 的属性
      const lockService = this.lockService;

      if (!lockService) {
        throw new Error(
          `Class ${target.constructor.name} missing 'lockService'`,
        );
      }

      // 解析 Key (保持之前的逻辑)
      const finalKey = keyPattern.replace(
        /{(\d+)(\.[\w\.]+)?}/g,
        (match, indexStr, path) => {
          const index = parseInt(indexStr);
          const arg = args[index];
          if (arg === undefined || arg === null) return 'undefined';
          if (!path) return String(arg);
          return String(arg[path.substring(1)]);
        },
      );

      //  传入 throwOnFail 参数
      return await lockService.runWithLock(
        finalKey,
        ttl,
        async () => {
          return originalMethod.apply(this, args);
        },
        throwOnFail,
      );
    };

    return descriptor;
  };
}
