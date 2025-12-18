/**
 * 分布式锁装饰器 (Proxy模式)
 * @param keyPattern 锁Key模板，支持 {0.prop} 语法。例: 'withdraw:{0.withdrawId}'
 * @param ttl 锁超时时间，默认 10秒
 */
export function DistributedLock(keyPattern: string, ttl: number = 10000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    // 显式声明 this 的类型，并捕获 args
    descriptor.value = async function (this: any, ...args: any[]) {
      const lockService = this.lockService;

      if (!lockService) {
        throw new Error(
          `Class ${target.constructor.name} is missing 'public readonly lockService' property for @DistributedLock`,
        );
      }

      // 解析 Key
      const finalKey = keyPattern.replace(
        /{(\d+)(\.[\w\.]+)?}/g,
        (match, indexStr, path) => {
          const index = parseInt(indexStr);
          const arg = args[index]; // 这里引用的 args 是上面传入的 ...args

          if (arg === undefined || arg === null) {
            return 'undefined';
          }

          if (!path) return String(arg);

          const propName = path.substring(1);
          return String(arg[propName]);
        },
      );

      // 执行锁逻辑
      // 使用箭头函数以保留外部的 this 上下文
      return await lockService.runWithLock(finalKey, ttl, async () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}
