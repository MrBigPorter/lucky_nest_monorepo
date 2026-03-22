# Flutter 登录对接精华版（OAuth + Email OTP）

> 仅保留 Flutter 实施必需信息：接口契约、平台配置边界、H5 开关策略、最小回归。  
> 代码优先：以 `admin/auth/*.ts` 实际实现为准。

---

## 0. 本次更新（2026-03-19）

- 已确认后端兼容 Flutter H5 的 OAuth 字段差异：
  - Google：支持 `idToken` 或 `credential`
  - Facebook：支持 `userId` 或 `userID`
- 已确认后端启用 `CORS_ORIGIN` 白名单（Flutter Web 需加入运行域名/端口）。
- 结论：当前后端兼容层已到位，后续优先做前端联调与配置对齐，不需要再做额外后端结构改造。

---

## 1. 当前状态（2026-03-19）

- 后端已支持：
  - OAuth：`google` / `facebook` / `apple`
  - Email OTP：`email/send-code` / `email/login`
- Flutter 已完成：
  - OAuth API/Model/Provider/UI 基础闭环
  - H5 按能力显示按钮（未配置时按钮禁用/隐藏，避免 MissingPlugin）
  - `auth` 字段对齐：`avatar/avartar` 兼容、`Profile.lastLoginAt` 时间戳对齐
- Flutter 待持续增强：
  - Email OTP 体验细节（文案、错误码映射、倒计时体验）
  - H5 Apple 登录（当前后置）

---

## 2. 接口契约（必须对齐）

### 2.1 登录接口

| 接口                           | 方法 | 请求体                                                  |
| ------------------------------ | ---- | ------------------------------------------------------- |
| `/api/v1/auth/oauth/google`    | POST | `{ idToken, inviteCode? }`（兼容 `{ credential }`）     |
| `/api/v1/auth/oauth/facebook`  | POST | `{ accessToken, userId, inviteCode? }`（兼容 `userID`） |
| `/api/v1/auth/oauth/apple`     | POST | `{ idToken, code?, inviteCode? }`                       |
| `/api/v1/auth/email/send-code` | POST | `{ email }`                                             |
| `/api/v1/auth/email/login`     | POST | `{ email, code }`                                       |

### 2.4 后端已做的 H5 兼容（2026-03-19）

- Google：`idToken` 和 `credential` 二选一都可。
- Facebook：`userId` 与 `userID` 都可，后端统一归一化。
- CORS：后端启用 `CORS_ORIGIN` 白名单，Flutter Web 需把运行域名加入该变量。

> 注意：兼容字段只是降低前端接入成本，不建议前端长期依赖多种字段写法。

### 2.5 请求体示例（可直接联调）

Google（标准写法）

```json
{
  "idToken": "eyJ...",
  "inviteCode": "ABCD12"
}
```

Google（H5 兼容写法）

```json
{
  "credential": "eyJ..."
}
```

Facebook（标准写法）

```json
{
  "accessToken": "EAAB...",
  "userId": "10200123456789"
}
```

Facebook（H5 兼容写法）

```json
{
  "accessToken": "EAAB...",
  "userID": "10200123456789"
}
```

### 2.2 会话接口

| 接口                   | 方法 | 请求体             |
| ---------------------- | ---- | ------------------ |
| `/api/v1/auth/refresh` | POST | `{ refreshToken }` |
| `/api/v1/auth/profile` | GET  | Bearer Token       |

### 2.3 返回关键字段

- 所有登录成功都应回到统一流程：`tokens.accessToken` + `tokens.refreshToken`。
- OAuth 返回 `provider`。
- Email 登录可能包含 `email`、`countryCode: "EMAIL"`。
- `send-code` 在非生产可能返回 `devCode`（生产不可依赖）。

---

## 3. Flutter 对接落点（单一事实源）

- API：`lib/core/api/lucky_api.dart`
- Model：`lib/core/models/auth.dart`
- Provider：`lib/core/providers/auth_provider.dart`
- 登录页：`lib/app/page/login_page.dart`
- 平台能力：`lib/core/services/auth/oauth_sign_in_service.dart`
- 配置：`lib/core/config/app_config.dart`

---

## 4. 平台配置边界（最重要）

### 4.1 客户端应该放什么

- 放：`client_id` / `app_id`（公开标识）
- 不放：`client_secret` / 私钥

### 4.2 后端应该放什么

- 至少：`GOOGLE_CLIENT_ID`、`APPLE_CLIENT_ID`
- 后端负责 token 最终校验与签发业务 JWT

### 4.3 App 端

- Google：`google-services.json` / `GoogleService-Info.plist`
- Facebook：Android/iOS 平台配置
- Apple：iOS/macOS capability

### 4.4 H5 端（当前策略）

- Google：`GOOGLE_WEB_CLIENT_ID` 非空 -> 按钮可用
- Facebook：`FACEBOOK_WEB_APP_ID` 非空 -> 按钮可用
- Apple：Web 仍后置（暂不开放）

后端 CORS 需要包含 Flutter Web 实际运行域名（示例）：

```bash
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:64979,https://admin.joyminis.com,https://dev.joyminis.com
```

> 若 Flutter Web 用随机端口调试，请同步追加到 `CORS_ORIGIN`，否则浏览器会被 CORS 拦截。

运行示例：

```bash
cd /Volumes/MySSD/work/dev/flutter_happy_app
fvm flutter run -d chrome \
  --dart-define=GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com \
  --dart-define=FACEBOOK_WEB_APP_ID=your_facebook_app_id \
  --dart-define=FACEBOOK_WEB_SDK_VERSION=v19.0
```

---

## 5. 登录流程统一规则

1. 调第三方 SDK 或 Email OTP 接口。
2. 调后端登录接口（OAuth/Email）。
3. 统一保存 token。
4. 统一拉取 `/auth/profile`。
5. 进入首页。

> 不允许每种登录方式各搞一套登录后逻辑。

---

## 6. 风险与处理

- `MissingPluginException` / `UnimplementedError`：
  - 原因：Web 调用了未配置/未支持插件能力
  - 处理：使用能力开关 + 按钮禁用/隐藏
- Facebook/H5 授权失败：
  - 检查 `FACEBOOK_WEB_APP_ID` 与平台控制台域名回调配置
- Google 401/audience mismatch：
  - 前端 Web client id 与后端 `GOOGLE_CLIENT_ID` 对齐
- Email OTP 失败：
  - 处理频控、过期、错误码提示，不吞异常

---

## 7. 后端是否还需要改（结论）

短结论：**当前这批 Flutter H5 问题，后端已做必要兼容，不需要继续改后端核心逻辑。**

优先排查顺序（90% 问题在这里）：

1. `CORS_ORIGIN` 是否包含 Flutter Web 当前域名和端口。
2. Google Web Client ID 是否与后端 `GOOGLE_CLIENT_ID` 一致（避免 audience mismatch）。
3. Facebook 控制台里的域名/回调配置是否与当前 Web 域名一致。
4. 前端请求体是否命中后端支持字段（`idToken|credential`、`userId|userID`）。

仅当以上都正确仍失败，再考虑新增后端日志字段或 provider 级诊断增强。

---

## 8. 最小回归（提交前必须跑）

```bash
cd /Volumes/MySSD/work/dev/flutter_happy_app
./tool/test_login_regression.sh
```

重点覆盖：

- OAuth/Email 模型解析
- 登录页按钮分支与模式切换
- 商业链路回归（防连带破坏）

---

## 9. 本文档维护原则

- 只保留当前可执行信息，不保留历史设计推演。
- 新增登录方式时，仅更新本文件和对应代码，不再新增平行“登录文档”。

---

## 10. 联调错误速查（Flutter H5）

| 现象                                           | 常见原因                                                     | 处理动作                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 浏览器报 CORS blocked                          | `CORS_ORIGIN` 缺少当前域名/端口                              | 把 Flutter Web 实际 origin 加到 `deploy/.env.dev` 的 `CORS_ORIGIN`，重启后端 |
| Google 登录 400（idToken/credential required） | 前端请求体字段名不匹配                                       | 发送 `idToken` 或 `credential` 任一字段                                      |
| Google 401 / audience mismatch                 | 前端 `GOOGLE_WEB_CLIENT_ID` 与后端 `GOOGLE_CLIENT_ID` 不一致 | 对齐 client id（同一个 Google OAuth App）                                    |
| Facebook 400（userId required）                | 前端发了 `userID` 但被中间层改掉，或字段为空                 | 确保 `userId`/`userID` 至少一个有值                                          |
| Facebook 授权成功但后端拒绝                    | `userId` 与 token 对应用户不一致                             | 确保请求体中的用户 ID 来自同一次授权返回                                     |
| Email OTP 总是失败                             | 超频、验证码过期、拿错环境 code                              | 先看 `send-code` 返回，开发环境优先用 `devCode` 联调                         |

后端排查日志点（优先看这些）：

1. `apps/api/src/client/auth/auth.controller.ts`：是否命中 OAuth 路由、字段归一化是否生效。
2. `apps/api/src/client/auth/providers/*.provider.ts`：token 校验失败具体在哪一步。
3. `apps/api/src/client/auth/auth.service.ts`：是否走到 `loginWithOauth()` / `loginWithEmailCode()`。
4. `apps/api/src/main.ts`：CORS 白名单是否按预期加载。

建议联调顺序：

1. 先用 Postman/HTTP 客户端验证接口（排除 Flutter SDK 干扰）。
2. 再接 Flutter H5，确认字段和 CORS。
3. 最后做端到端回归（登录 -> profile -> 页面跳转）。
