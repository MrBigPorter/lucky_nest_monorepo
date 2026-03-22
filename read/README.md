# 📚 文档导航 — Lucky Nest Monorepo

> **35 个文档，6 大分类。先看「必读」，再按需查。**  
> 最后更新：2026-03-22

---

## ⚡ 必读（新人 / 重新上手 请按顺序读这 3 个）

| #   | 文件                                                   | 一句话                                           |
| --- | ------------------------------------------------------ | ------------------------------------------------ |
| 1   | [`DEPLOY_QUICKSTART_CN.md`](./DEPLOY_QUICKSTART_CN.md) | 15 分钟从零把项目跑起来                          |
| 2   | [`ONBOARDING_CN.md`](./ONBOARDING_CN.md)               | 项目全貌、技术栈、开发环境配置                   |
| 3   | [`../RUNBOOK.md`](../RUNBOOK.md)                       | 发布 / 回滚 / 服务器操作完整手册（**唯一权威**） |

---

## 🏗️ 一、架构设计（6 个）

> 理解系统怎么搭的，面试备用。

| 文件                                                                                                         | 内容                                                        | 行数 |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ---- |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)                                                                       | 旧版系统架构总览（历史参考）                                | 49   |
| [`ADMIN_NEXT_SSR_CSR_REVIEW_CN.md`](./ADMIN_NEXT_SSR_CSR_REVIEW_CN.md)                                       | ⭐ Admin Next SSR/CSR 架构评审 + 6-Stage 重构路线图（最新） | 492  |
| [`SSR_UPGRADE_ANALYSIS_CN.md`](./SSR_UPGRADE_ANALYSIS_CN.md)                                                 | SSR 升级完整分析（历史过程文档）                            | 1458 |
| [`SERVER_FETCH_GUIDE_CN.md`](./SERVER_FETCH_GUIDE_CN.md)                                                     | Server Component 数据获取模式速查                           | 210  |
| [`ADMIN_NEXT_ARCHITECTURE_INTERVIEW_CN.md`](./ADMIN_NEXT_ARCHITECTURE_INTERVIEW_CN.md)                       | 面试题：架构问答（含标准答案）                              | 223  |
| [`ADMIN_NEXT_ARCHITECTURE_5MIN_ORAL_CN.md`](./ADMIN_NEXT_ARCHITECTURE_5MIN_ORAL_CN.md)                       | 5 分钟口述架构要点                                          | 108  |
| [`ADMIN_NEXT_ARCHITECTURE_INTERVIEW_FLASHCARDS_CN.md`](./ADMIN_NEXT_ARCHITECTURE_INTERVIEW_FLASHCARDS_CN.md) | 架构知识闪卡（背诵用）                                      | 121  |

---

## 🚀 二、部署 & 运维（6 个）

> 出故障先查 RUNBOOK，再查这里。

| 文件                                                                 | 内容                                               | 行数 |
| -------------------------------------------------------------------- | -------------------------------------------------- | ---- |
| [`DEPLOY_QUICKSTART_CN.md`](./DEPLOY_QUICKSTART_CN.md)               | ⭐ 本地启动 / 生产部署 15 分钟快启                 | 119  |
| [`SEED_GUIDE_CN.md`](./SEED_GUIDE_CN.md)                             | ⭐ 数据初始化：如何跑 seed、重置密码、服务器操作   | 366  |
| [`PRISMA_V6_MIGRATION_CN.md`](./PRISMA_V6_MIGRATION_CN.md)           | Prisma v6 升级踩坑 + 修复方案                      | 170  |
| [`TSCONFIG_MONOREPO_CN.md`](./TSCONFIG_MONOREPO_CN.md)               | Monorepo tsconfig 规范（违反会导致 dist 路径错乱） | 189  |
| [`DEPLOY_INCIDENT_20260321_CN.md`](./DEPLOY_INCIDENT_20260321_CN.md) | 事故复盘：2026-03-21 容器启动失败 rootDir 问题     | 379  |
| [`MIGRATION_LOG_CN.md`](./MIGRATION_LOG_CN.md)                       | 历次迁移简要记录                                   | 20   |

---

## 📊 三、性能 & 监控（3 个）

> Lighthouse 跑分 + Sentry 错误上报。

| 文件                                                   | 内容                                                   | 行数 |
| ------------------------------------------------------ | ------------------------------------------------------ | ---- |
| [`LHCI_SENTRY_SETUP_CN.md`](./LHCI_SENTRY_SETUP_CN.md) | ⭐ Lighthouse CI + Sentry 工作原理、接入配置、运维操作 | 240  |
| [`SEO_SUMMARY_CN.md`](./SEO_SUMMARY_CN.md)             | SEO 优化总结（meta/OG/结构化数据）                     | 526  |
| [`SEO_PERFORMANCE_CN.md`](./SEO_PERFORMANCE_CN.md)     | Core Web Vitals 指标详解与优化手段                     | 228  |

> **Lighthouse CI 配置文件**：`apps/admin-next/lighthouserc.mjs`（含中英文注释，说明每个参数含义）  
> **Sentry 配置文件**：`apps/admin-next/sentry.*.config.ts` + `src/instrumentation.ts`（含工作原理注释）

---

## 🧪 四、测试（4 个）

> 写测试前先看规范，不然 CI 红灯。

| 文件                                                           | 内容                                                | 行数 |
| -------------------------------------------------------------- | --------------------------------------------------- | ---- |
| [`TESTING_STANDARDS_CN.md`](./TESTING_STANDARDS_CN.md)         | ⭐ 测试规范：高频禁令、错误速查表、模板（**必读**） | 281  |
| [`TESTING_CN.md`](./TESTING_CN.md)                             | Vitest 单测完整指南                                 | 1011 |
| [`TESTING_API_CN.md`](./TESTING_API_CN.md)                     | 后端 API 接口测试指南                               | 989  |
| [`PHASE5_E2E_AND_BUGFIX_CN.md`](./PHASE5_E2E_AND_BUGFIX_CN.md) | Phase 5 E2E 测试过程 + Bug 修复记录                 | 451  |

---

## 🔧 五、功能专题（12 个）

> 按功能模块查，了解设计决策和实现细节。

### IM / 客服

| 文件                                                           | 内容                                | 行数 |
| -------------------------------------------------------------- | ----------------------------------- | ---- |
| [`IM_SUPPORT_REALTIME_CN.md`](./IM_SUPPORT_REALTIME_CN.md)     | 客服实时分发方案（Socket 推送架构） | 607  |
| [`IM_SUPPORT_TECH_SHARE_CN.md`](./IM_SUPPORT_TECH_SHARE_CN.md) | IM 技术分享（原理 + 代码解析）      | 700  |
| [`Chat Service.md`](./Chat%20Service.md)                       | 聊天服务设计文档                    | 810  |

### 登录 / 认证

| 文件                                                                               | 内容                                         | 行数 |
| ---------------------------------------------------------------------------------- | -------------------------------------------- | ---- |
| [`OAUTH_THIRDPARTY_LOGIN_CN.md`](./OAUTH_THIRDPARTY_LOGIN_CN.md)                   | Google/Facebook/Apple OAuth 三方登录完整方案 | 1835 |
| [`FLUTTER_OAUTH_INTEGRATION_GUIDE_CN.md`](./FLUTTER_OAUTH_INTEGRATION_GUIDE_CN.md) | Flutter 端 OAuth 集成步骤                    | 246  |
| [`REGISTER_APPLICATION_CN.md`](./REGISTER_APPLICATION_CN.md)                       | 注册申请功能（reCAPTCHA + 邮件通知 + 审批）  | 217  |

### 营销 / 活动

| 文件                                                                         | 内容                | 行数 |
| ---------------------------------------------------------------------------- | ------------------- | ---- |
| [`LUCKY_DRAW_DESIGN_CN.md`](./LUCKY_DRAW_DESIGN_CN.md)                       | 幸运抽奖系统设计    | 1441 |
| [`LOTTERY_AND_FLASHSALE_IMPL_CN.md`](./LOTTERY_AND_FLASHSALE_IMPL_CN.md)     | 抽奖 + 秒杀实现细节 | 391  |
| [`FLASH_SALE_REALTIME_STRATEGY_CN.md`](./FLASH_SALE_REALTIME_STRATEGY_CN.md) | 秒杀实时库存策略    | 85   |

### 其他功能

| 文件                                                                   | 内容                  | 行数 |
| ---------------------------------------------------------------------- | --------------------- | ---- |
| [`FEATURES_CN.md`](./FEATURES_CN.md)                                   | 全部功能清单（23 项） | 1093 |
| [`IMPL_PROGRESS_CN.md`](./IMPL_PROGRESS_CN.md)                         | 功能实现进度记录      | 179  |
| [`PRODUCT_ASSET_UPLOAD_LIST_CN.md`](./PRODUCT_ASSET_UPLOAD_LIST_CN.md) | 产品素材上传规范      | 83   |

---

## 📝 六、待办 & 索引

| 文件                       | 内容                   |
| -------------------------- | ---------------------- |
| [`TODO.md`](./TODO.md)     | 待处理事项             |
| [`README.md`](./README.md) | 本文件（文档分类索引） |

---

## 🔍 快速定位（按问题查）

| 我遇到的问题                           | 去看哪里                                                     |
| -------------------------------------- | ------------------------------------------------------------ |
| 本地跑不起来                           | `DEPLOY_QUICKSTART_CN.md`                                    |
| 生产部署 / 回滚                        | `RUNBOOK.md`                                                 |
| 服务器初始化 seed / 重置密码           | `SEED_GUIDE_CN.md`                                           |
| Sentry 没收到报错 / Lighthouse CI 红了 | `LHCI_SENTRY_SETUP_CN.md`                                    |
| CI 单测红灯                            | `TESTING_STANDARDS_CN.md`                                    |
| Docker 容器找不到 `dist/main.js`       | `DEPLOY_INCIDENT_20260321_CN.md` + `TSCONFIG_MONOREPO_CN.md` |
| Prisma 模型改了但 TS 报错              | `PRISMA_V6_MIGRATION_CN.md`                                  |
| 想了解 IM 客服怎么实现的               | `IM_SUPPORT_REALTIME_CN.md`                                  |
| 想了解 SSR 是怎么做的                  | `ADMIN_NEXT_SSR_CSR_REVIEW_CN.md`                            |
| OAuth 登录对接                         | `OAUTH_THIRDPARTY_LOGIN_CN.md`                               |

---

## 📋 文档维护约定

- **发布流程**：只在 `RUNBOOK.md` 维护，其他文档不重复
- **新人上手**：只在 `DEPLOY_QUICKSTART_CN.md` + `ONBOARDING_CN.md` 维护
- **新增功能**：在对应专题文档更新，同时在 `FEATURES_CN.md` + `IMPL_PROGRESS_CN.md` 加条目
- **事故复盘**：新建 `DEPLOY_INCIDENT_YYYYMMDD_CN.md`，在本索引登记
