# 公共 TypeScript 基座：config/tsconfig.base.json

“所有子包共同继承”的 TypeScript 默认集，用来避免在每个包里重复写相同的严格模式、互操作等选项。

## 不要放的东西（环境相关）
- `module` / `moduleResolution` / `lib` / `jsx`
- `rootDir` / `outDir` / `noEmit`
- 装饰器相关：`emitDecoratorMetadata` / `experimentalDecorators`
- 这些因“前端 / 后端 / 库”不同而不同，应在各自子包的 `tsconfig` 里覆盖。

## 原理（extends 合并）
- 子包 `tsconfig.json` 的字段会**覆盖** base 的同名字段；
- **数组字段**（如 `lib`、`types`）通常是**整体替换**而不是合并；
- `include` / `exclude` 也是“谁声明谁生效”，不会自动合并。
## 常用命令

```bash
# 安装依赖（在仓库根目录）
yarn install

# 编译 shared 包
yarn workspace @lucky/shared build
```