# @lucky/api 手册


---

## 0. 我是谁？我能做什么？

* 这是 mono‑repo 里的 **后端 API 子包**，技术栈 **NestJS + Prisma + PostgreSQL**。
* 给前端（Next / Flutter）提供接口；自带 Swagger 文档、校验、限流与安全头部。

---

## 1) 快速开始（30 秒试跑）

> **在仓库根目录执行**（我们用 Yarn Workspaces 点名到 @lucky/api）。

```bash
# 1) 起一个本地 Postgres（Docker）
docker run --name dev-postgres -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_USER=dev -e POSTGRES_DB=app \
  -p 5432:5432 -d postgres:16

# 2) 准备环境变量
cp apps/api/.env.example apps/api/.env
# 打开 .env，确认 DATABASE_URL 与 PORT（默认 3001）

# 3) 初始化数据库（第一次）
yarn workspace @lucky/api prisma migrate dev

# 4) 开发启动（热重载）
yarn workspace @lucky/api start:dev
```

打开：

* **Swagger 文档**：`http://localhost:3001/docs`
* **CORS 允许来源**：在 `.env` 的 `CORS_ORIGIN` 里配置（多个用逗号）

> 看不到 Swagger？见下方【常见故障排查】中的“Swagger 空白页”。

---

## 2) 目录结构（看这个你就知道改哪里）

```
apps/api/
  src/
    main.ts              # 启动入口（helmet/cookie/校验/Swagger 等在这里挂载）
    app.module.ts        # 依赖注入根模块（Config、Throttler 等）
    users/               # 示例业务模块（Controller/Service/DTO）
  prisma/
    schema.prisma        # 数据模型（改这里）
    migrations/          # Prisma 迁移记录
  test/                  # 单元/E2E 测试
  .env(.example)         # 环境变量
  package.json           # 脚本与依赖
  tsconfig.json          # 继承根的 tsconfig.base
  tsconfig.build.json    # 构建用 TS 配置（排除 test）
  nest-cli.json          # Nest 构建配置（默认即可）
```

---

## 3) 脚本速查（全部在根目录执行）

```bash
# 开发/构建/运行
yarn workspace @lucky/api start:dev   # 开发热重载
yarn workspace @lucky/api build       # 编译到 dist/
yarn workspace @lucky/api start       # 运行 dist

# 数据库（Prisma）
yarn workspace @lucky/api prisma migrate dev    # 生成并应用迁移
yarn workspace @lucky/api prisma generate       # 生成 Prisma Client
yarn workspace @lucky/api prisma studio         # GUI 管理数据库
```

---

## 4) 依赖清单（是什么 & 为什么）

> **运行必备 → 基线能力 → 开发期工具 → 数据库层**

### 4.1 运行必备（Nest 核心）

* `@nestjs/common @nestjs/core @nestjs/platform-express`：Nest 框架核心与默认平台（Express）。
* `reflect-metadata`：装饰器依赖的反射能力（TS 装饰器必备）。
* `rxjs`：响应式库（Nest 的一部分 API 用到）。

### 4.2 基线能力（安全/配置/文档/限流/Cookie）

* `@nestjs/config`：集中读 `.env` → 提供 `ConfigService`。
* `class-validator` + `class-transformer`：DTO 入参与返回体的**校验**与**类型转换**（全局 `ValidationPipe` 自动生效）。
* `@nestjs/swagger` + `swagger-ui-express`：自动生成 OpenAPI 文档与浏览器 UI（`/docs`）。
* `helmet`：常见安全 HTTP 头（XSS/Clickjacking 基础防护）。
* `cookie-parser`：解析请求中的 Cookie（便于无前端改造的 Cookie 登录）。
* `@nestjs/throttler`：简单限流（防刷、防爆破）。

* `@types/cookie-parser`：TypeScript 类型补充（dev）。

### 4.3 开发期工具（只在本机/CI 用）

* `@nestjs/cli @nestjs/schematics`：脚手架与代码生成（`nest g resource users`）。
* `@nestjs/testing`：测试辅助（构建测试模块、E2E 启动）。
* `typescript ts-node tsconfig-paths`：TypeScript 编译、直接运行 `.ts`、解析 `paths` 别名。

### 4.4 数据库（Prisma + Postgres）

* `prisma`（dev）+ `@prisma/client`：ORM 与生成的 Client。
* Postgres：我们用 Docker 起一个 `postgres:16` 容器。

---

## 5) 环境变量（.env 示例）

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://dev:dev@localhost:5432/app
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=replace_me
```

> 建议在 `AppModule` 用 **Joi** 做启动期校验（防止漏配）：`validationSchema: Joi.object({...})`

---

## 6) 关键中间件是如何工作的（一句话原理）

* **ValidationPipe**：读取 DTO 上的装饰器（`@IsString()` 等），在进入 Controller 前做 **运行时校验** 与 **类型转换**（可 `whitelist` 移除未声明字段）。
* **Swagger**：扫描路由/DTO 装饰器生成 OpenAPI JSON，用 `swagger-ui-express` 渲染网页。
* **Helmet**：设置安全相关响应头；开发时可关闭部分 CSP 以便 Swagger 正常加载。
* **Throttler**：基于内存计数的限流（可换 Redis 适配器做分布式）。
* **ConfigModule**：读取 `.env` 并注入 `ConfigService`；建议只在 `AppModule` 初始化一次并 `isGlobal: true`。

---

## 7) 做一次最小“自测”

1. `GET http://localhost:3001/api/health`（如果项目里有健康检查路由）应返回 `200`。
2. 打开 `http://localhost:3001/docs`，能看到接口分组与 DTO 字段。
3. 关掉数据库容器再访问任意需要 DB 的接口，应得到友好错误而非进程崩溃（Prisma 错误会被过滤成 5xx）。

> 项目初期没有健康检查？可以在 `AppController` 临时加一个 `@Get('health')` 返回 `{ ok: true }`。

---

## 8) 常见故障排查（遇到 90% 的问题先看这里）

* **端口被占用**：改 `.env` 的 `PORT` 或释放占用进程。
* **数据库连不通**：`docker ps` 看容器是否在，`DATABASE_URL` 用户名/密码/端口是否一致。
* **Swagger 空白页**：开发环境把 `helmet` 的 `contentSecurityPolicy` 关掉或放行 Swagger 静态资源。
* **报找不到别名模块**（如 `@api/*`）：运行 `.ts` 时要 `-r tsconfig-paths/register`；构建后别名会被解析成相对路径。
* **Nest 版本不一致**：`@nestjs/*` 主版本（v10）要统一，否则类型/运行时会冲突。

---

## 9) 代码风格与提交

* ESLint/Prettier 按仓库统一规则；TypeScript 开启严格模式。
* 提交规范：Conventional Commits（`feat:` / `fix:` / `docs:` / `chore:` ...）。
* 重要 API 变更在 `CHANGELOG.md` 标注**破坏性变更**。

---

## 10) 附录：为什么我们这样分层

* **可理解性**：把“运行必备 / 基线能力 / 开发工具 / 数据层”分开讲，新人不容易混。
* **可维护性**：环境相关的配置（`lib / module / decorators`）放在各子包 `tsconfig.*.json`，共享选项放 `config/tsconfig.base.json`。
* **可演进**：当前默认 Express + CJS，后续如果需要可平滑切到 Fastify 或 ESM 双产物（不影响业务代码）。

---

## 11) 附：一键安装指令（给新同学复制用）

```bash
# 运行必备
yarn workspace @lucky/api add @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs

# 基线能力
yarn workspace @lucky/api add @nestjs/config class-validator class-transformer @nestjs/swagger swagger-ui-express helmet cookie-parser @nestjs/throttler
yarn workspace @lucky/api add -D @types/cookie-parser

# 开发依赖（CLI/TS/别名/测试）
yarn workspace @lucky/api add -D @nestjs/cli @nestjs/schematics @nestjs/testing typescript ts-node tsconfig-paths

# 运行时校验库（可选，推荐用于 .env 校验）
yarn workspace @lucky/api add joi

# 数据库 + Prisma
yarn workspace @lucky/api add -D prisma
# 先装 client 再 init（或同一步骤装完后再 init）
yarn workspace @lucky/api add @prisma/client
yarn workspace @lucky/api dlx prisma init

# 格式化 + 语法校验
yarn workspace @lucky/api dlx prisma format
yarn workspace @lucky/api dlx prisma validate

# 迁移 & 生成客户端
yarn workspace @lucky/api dlx prisma migrate dev --name init
yarn workspace @lucky/api dlx prisma generate

# （可选）种子 & 可视化 
yarn workspace @lucky/api dlx prisma db seed
yarn workspace @lucky/api dlx prisma studio

# 以后做健康检查更方便
yarn workspace @lucky/api add @nestjs/terminus
```

## 11）快速联通测试
## 在 apps/api/src/app.controller.ts 里加一个路由测试数据库
```bash
import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

@Controller()
export class AppController {
  @Get('health')
  health() { return { ok: true }; }

  @Get('dbcheck')
  async dbcheck() {
    const count = await prisma.user.count();
    return { users: count };
  }
}
启动后访问 http://localhost:4000/api/dbcheck，应返回 { "users": 0 } 或种子后的数量。
```

## 12)Users 模块
```bash
# 生成骨架
# 生成文件（在仓库根目录执行）
yarn workspace @lucky/api run nest g module users
yarn workspace @lucky/api run nest g service users --no-spec
yarn workspace @lucky/api run nest g controller users --no-spec
```

# 14) Auth（JWT 登录/注册/保护路由）
```bash
# 	移动端（Flutter）用 Bearer；Web SSR 也可改 Cookie。 先做 Access Token，Refresh 可以下一步增强。

# 安装依赖
yarn workspace @lucky/api add @nestjs/passport passport @nestjs/jwt passport-jwt bcrypt
yarn workspace @lucky/api add -D @types/passport-jwt @types/bcrypt

# 生成模块骨架
yarn workspace @lucky/api run nest g module auth
yarn workspace @lucky/api run nest g service auth --no-spec
yarn workspace @lucky/api run nest g controller auth --no-spec
```

# 15）流程图
```bash
main.ts 启动 -> AppModule
    |
    +-- imports: [UsersModule, AuthModule, JwtModule, ConfigModule...]
            |
            +-- UsersModule
            |     |- UsersController (HTTP 路由: /users/**)
            |     '- UsersService    (被注入，提供方法)
            |
            '- AuthModule
                  |- AuthController (/auth/login)
                  |- AuthService    (校验 + 签 JWT)
                  |- JwtStrategy    (解析 JWT，给 req.user)
                  '- JwtAuthGuard   (保护路由)


	•	Controller 就是路由； 只管“路由/协议”（HTTP 路径、方法、参数）。
	•	Service/Provider 只管“业务与能力”（数据库、发短信、加密、缓存……）
	•	Module 把一组 Controller + Provider 打包，并决定“谁能用谁”（imports / providers / exports）。
	•	DI 容器（依赖注入）根据装饰器元数据，把你要的服务按类型塞进来（constructor(private users: UsersService){}）。
	记口诀：Controller 收/发、Service 干活、Module 装配、DI 注入。
	
	一次 HTTP 请求在 Nest 里的“流水线”
	请求 → (中间件 middleware，例如 cookie-parser/helmet)
     → (守卫 guards，例如 JwtAuthGuard 鉴权)
     → (拦截器 interceptors - 前置)
     → (管道 pipes - 验证/转换 DTO)
     → Controller 方法
     → Service（业务）
     → Repository/Prisma（数据）
     → (拦截器 - 后置，统一响应/日志)
     → (异常过滤器 filters - 兜底错误)
     → 响应
     
     
 AppModule
 ├─ imports: ConfigModule(全局), ThrottlerModule, PrismaModule(全局),
 │          UsersModule, AuthModule
 ├─ controllers: AppController(health, dbcheck)
 └─ providers:  AppService(可选)

PrismaModule (@Global)
 └─ providers/exports: PrismaService  ← 封装 PrismaClient，供全局注入

UsersModule
 ├─ providers: UsersService           ← 用 PrismaService 做用户数据
 ├─ controllers: UsersController      ← /users 列表/创建
 └─ exports: UsersService             ← 让 AuthModule 可用

AuthModule
 ├─ imports: UsersModule, ConfigModule, JwtModule.registerAsync(...)
 ├─ providers: AuthService, JwtStrategy
 └─ controllers: AuthController (/auth/register, /auth/login, /auth/profile)
```
> 温馨提示：**不要死记**每个包做什么；先把服务跑起来，遇到需求（需要限流/需要文档/需要 Cookie ）时再回来查这一节即可。
