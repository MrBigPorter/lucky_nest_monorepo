---
docker exec -it lucky-backend-dev sh -lc '
set -e
# 1) 清空本地迁移目录（确保从零开始）
rm -rf apps/api/prisma/migrations && mkdir -p apps/api/prisma/migrations

# 2) 重置数据库（跳过交互）
yarn workspace @lucky/api prisma migrate reset --force --skip-seed

# 3) 基于当前 schema 生成并应用首个迁移，名字就叫 init
yarn workspace @lucky/api prisma migrate dev --name init

# 4) 生成 client 并检查状态
yarn workspace @lucky/api prisma generate
yarn workspace @lucky/api prisma migrate status
ls -la apps/api/prisma/migrations
'
---


# Prisma 操作手册（容器版 · Lucky Monorepo）

> 面向你的 **Docker 化 NestJS monorepo**（容器名：`lucky-backend-dev`，workspace：`@lucky/api`，schema：`apps/api/prisma/schema.prisma`）。
> 目标：**不再漂移（drift）**、**不再混乱**。所有命令默认在 **容器内** 执行。

---

## 0) 三条铁律（背下来就不乱）

1. **只用迁移（migrate）管结构**
    - 开发：`prisma migrate dev`
    - 上线/CI：`prisma migrate deploy`
    - **不要**把 `prisma db push` 放进启动脚本；团队/生产环境禁用。

2. **所有 Prisma 命令都在容器里跑**
    - 统一写法：
      ```bash
      docker exec -it lucky-backend-dev sh -lc "<PRISMA 命令>"
      ```

3. **迁移是唯一真相（Source of Truth）**
    - `apps/api/prisma/migrations` **必须提交到 Git**。

---

## 1) 环境约定（一次配置，长期受用）

- **容器内连接串**：`apps/api/.env.docker`
  ```env
  DATABASE_URL="postgresql://postgres:postgres@db:5432/app?schema=public"
  ```

- **docker-compose.yml（关键片段）**
  ```yaml
  services:
    backend:
      env_file: [apps/api/.env.docker]
      command: >
        sh -lc "yarn workspace @lucky/api prisma generate &&
                yarn workspace @lucky/api start:dev"   # ← 不要放 db push
      volumes:
        - .:/app
        - /app/node_modules
        - /app/apps/api/node_modules
      depends_on:
        db:
          condition: service_healthy

    db:
      image: postgres:16
      environment:
        POSTGRES_USER: ${POSTGRES_USER:-postgres}
        POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
        POSTGRES_DB: ${POSTGRES_DB:-app}
      ports:
        - "${POSTGRES_PORT:-5432}:5432"
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -U $$POSTGRES_USER -d $$POSTGRES_DB"]
        interval: 5s
        timeout: 3s
        retries: 20
        start_period: 10s
  ```

> 备注：容器网络内 DB 主机名固定为 `db`；**容器里**一律连 `db:5432`。

---

## 2) 决策表：**什么时候用什么**

> 口诀：**改 schema → 跑 migrate → generate**。

| 想做的事 | `schema.prisma` 怎么写 | 在容器里执行 |
|---|---|---|
| **新项目/空库初始化** | 写好所有 `model` | `prisma migrate dev --name init` |
| **已有表但无迁移（要保数据）** | 字段加 `@map` 与现有列对齐 | **基线迁移**（见 §4.2） |
| 新建表 | 新增 `model` | `prisma migrate dev --name create_xxx_table` |
| 新增字段 | 给 `model` 加字段 | `prisma migrate dev --name add_xxx_field` |
| 删除字段 | 从 `model` 删除字段（会丢数据） | `prisma migrate dev --name drop_xxx_field` |
| **改字段名（只改代码名）** | 改名 + `@map("旧列名")`（DB 列不变） | `prisma migrate dev --name refactor_field_names`（零风险） |
| **改字段名（DB 列也改）** | 先保留 `@map("旧列名")` | 走 **安全重命名**（§4.1） |
| 改字段类型（可安全转换） | 改类型/加 `@db.xxx` | `prisma migrate dev --name alter_type_xxx` |
| 改字段类型（不兼容） | 新列→回填→替换（手写 SQL） | `migrate dev --create-only` + 编辑 SQL（§4.3） |
| 加/改索引与唯一约束 | `@@index` / `@unique` | `prisma migrate dev --name add_index_xxx` |
| 新增枚举 | 新建 `enum` + 改字段类型 | `prisma migrate dev --name add_enum_xxx` |
| 外键/关系调整 | 改 `@relation` | `prisma migrate dev --name update_relations` |
| **出现 drift** | —— | **重置**（§4.4）或 **基线**（§4.2），二选一 |

---

## 3) 常用脚本（建议加到 package.json）

> 以下都在容器里执行（已含 `docker exec`），直接复制：

```json
{
  "scripts": {
    "pr:m:dev":     "docker exec -it lucky-backend-dev sh -lc \"yarn workspace @lucky/api prisma migrate dev --name change && yarn workspace @lucky/api prisma generate\"",
    "pr:m:deploy":  "docker exec -it lucky-backend-dev sh -lc \"yarn workspace @lucky/api prisma migrate deploy && yarn workspace @lucky/api prisma generate\"",
    "pr:m:status":  "docker exec -it lucky-backend-dev sh -lc \"yarn workspace @lucky/api prisma migrate status\"",
    "pr:m:reset":   "docker exec -it lucky-backend-dev sh -lc \"yarn workspace @lucky/api prisma migrate reset --force --skip-seed && yarn workspace @lucky/api prisma generate\"",
    "pr:gen":       "docker exec -it lucky-backend-dev sh -lc \"yarn workspace @lucky/api prisma generate\"",
    "pr:studio":    "docker exec -it lucky-backend-dev sh -lc \"yarn workspace @lucky/api prisma studio --port 5555\"",
    "pr:baseline":  "docker exec -it lucky-backend-dev sh -lc 'mkdir -p apps/api/prisma/migrations/BASELINE && yarn workspace @lucky/api prisma migrate diff --from-empty --to-schema-datamodel apps/api/prisma/schema.prisma --script > apps/api/prisma/migrations/BASELINE/migration.sql && yarn workspace @lucky/api prisma migrate resolve --applied BASELINE && yarn workspace @lucky/api prisma migrate status'"
  }
}
```

---

## 4) 标准流程模板

### 4.1 字段**安全重命名**（代码名 + DB 列名一起改）




---

### 4.2 **基线迁移**（已有数据，不能清空）

**场景**：库里已有表（多半是早期 `db push` 生成），迁移目录为空或不一致。

**做法**：

1) 生成“空库 → 当前 schema”的 SQL：
   ```bash
   mkdir -p apps/api/prisma/migrations/BASELINE
   prisma migrate diff \
     --from-empty \
     --to-schema-datamodel apps/api/prisma/schema.prisma \
     --script > apps/api/prisma/migrations/BASELINE/migration.sql
   ```

2) 标记该迁移为**已应用**（不执行 SQL，不动数据）：
   ```bash
   prisma migrate resolve --applied BASELINE
   ```

3) 后续改表：`prisma migrate dev --name <变更>`。

---

### 4.3 类型不兼容的**有损变更**（安全范式）

**思路**：新列 → 回填 → 删旧列 → 改名。示例：把 `varchar age_text` 迁到 `int age`。

1) 生成空迁移：
   ```bash
   prisma migrate dev --name manual_cast --create-only
   ```

2) 编辑 SQL：
   ```sql
   ALTER TABLE public.users ADD COLUMN age_int int;
   UPDATE public.users SET age_int = NULLIF(age_text, '')::int;
   ALTER TABLE public.users DROP COLUMN age_text;
   ALTER TABLE public.users RENAME COLUMN age_int TO age;
   ```

3) 应用：`prisma migrate dev`

---

### 4.4 处理 **drift**（数据库 ≠ 迁移历史）

- **开发库（可丢数据）**
  ```bash
  prisma migrate reset --force --skip-seed
  prisma migrate dev --name init
  prisma generate
  ```

- **要保数据**  
  走 **基线迁移**（§4.2）。

---

## 5) 注释与可读性（强烈推荐）

- **开发/代码层注释**：在 `schema.prisma` 用 `///` 写文档注释（VS Code / Prisma Studio 都会显示）。
  ```prisma
  /// 短信验证码记录
  enum SmsCodeType {
    /// 用户注册
    REGISTER
    /// 登录
    LOGIN
    /// 修改密码
    RESET_PASSWORD
    /// 绑定手机号
    BIND_PHONE
    /// 提现
    WITHDRAW
  }
  ```

- **数据库真实注释**：在迁移 SQL 写 `COMMENT ON ...`：
  ```sql
  COMMENT ON TABLE public.sms_verification_codes IS '短信验证码记录';
  COMMENT ON COLUMN public.sms_verification_codes.code_type IS 'REGISTER/LOGIN/RESET/BIND/WITHDRAW';
  ```

---

## 6) 十秒自检与排错

```bash
# 容器里实际连接串
docker exec -it lucky-backend-dev printenv DATABASE_URL

# 迁移目录是否存在
docker exec -it lucky-backend-dev sh -lc "ls -la apps/api/prisma/migrations"

# 当前迁移状态
docker exec -it lucky-backend-dev sh -lc "yarn workspace @lucky/api prisma migrate status"

# Prisma CLI / Client 版本一致（容器里）
docker exec -it lucky-backend-dev sh -lc 'npx prisma -v && node -e "console.log(require(\"@prisma/client/package.json\").version)"'
```

**仍出现 drift**：
- 确认启动命令里 **没有** `db push`。
- 在 §4.4 二选一（**重置**或**基线**），不要混用。

---

## 7) 黑名单：**绝对不要做的事**

- ❌ 在服务启动命令里执行 `prisma db push`。
- ❌ 同时在“容器”和“本机”随意执行 Prisma（除非严格区分 `.env` 和职责）。
- ❌ 在多个 workspace 安装不同版本的 `@prisma/client`（请只在 `@lucky/api` 安装，并与 `prisma` 版本一致）。
- ❌ 直接手改数据库结构却不写迁移（真要手改，请把 SQL 放进迁移文件）。

---

### 附录 A. 枚举替代魔法数字（示例）

```prisma
enum SmsCodeType { REGISTER LOGIN RESET_PASSWORD BIND_PHONE WITHDRAW }

model SmsVerificationCode {
  // 原: codeType Int @db.SmallInt
  codeType SmsCodeType @map("code_type")
}
```

迁移：
```bash
docker exec -it lucky-backend-dev sh -lc "yarn workspace @lucky/api prisma migrate dev --name code_type_enum && yarn workspace @lucky/api prisma generate"
```

---

### 附录 B. 一键初始化（开发库，可清空）

```bash
docker exec -it lucky-backend-dev sh -lc "yarn workspace @lucky/api prisma migrate reset --force --skip-seed && yarn workspace @lucky/api prisma migrate dev --name init && yarn workspace @lucky/api prisma generate"
```

---

> **终极口诀**：**改 schema → migrate dev → generate**；遇到 drift：**开发库重置** / **有数据做基线**。命令全部在容器里跑，**别用 db push 偷跑结构**。
