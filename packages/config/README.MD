# 公共 TypeScript 基座：config/tsconfig.base.json

# 一个“所有子包共同继承”的 TypeScript 默认集。
# 避免每个包都重复写相同的严格模式、互操作等选项。

# 不要放的东西（环境相关）

# module / moduleResolution / lib / jsx / rootDir / outDir / noEmit / decorators ...
# 这些因“前端/后端/库”不同而不同，应在各自子包 tsconfig 里覆盖。

# 原理（extends 合并）
# •	子包 tsconfig.json 里的字段覆盖 base 的同名字段；数组通常是整体覆盖而不是合并。
# •	include/exclude 也是“谁声明谁生效”，不会自动合并。