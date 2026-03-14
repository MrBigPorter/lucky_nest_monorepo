/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 基础路径, 默认 /api */
  readonly VITE_API_BASE_URL: string;
  /** 应用名称 */
  readonly VITE_APP_NAME: string;
  /** 版本号 */
  readonly VITE_APP_VERSION: string;
  /** 环境标识: development | production */
  readonly VITE_APP_ENV: string;
  /** 是否启用图片优化 */
  readonly VITE_ENABLE_IMAGE_OPTIMIZATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
