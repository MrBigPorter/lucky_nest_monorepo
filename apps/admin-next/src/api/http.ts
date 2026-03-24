import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CanceledError,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse, RequestConfig, RequestTraceConfig } from './types'; // 注意：这里不要写 .ts 后缀
import {
  SENTRY_SPAN_ATTR_KEY,
  SENTRY_SPAN_NAME,
} from '@/lib/sentry-span-constants';
import { withHttpClientSpan } from '@/lib/sentry-span';
import { useToastStore } from '@/store/useToastStore';

/* eslint-disable @typescript-eslint/no-explicit-any */
class HttpClient {
  private readonly instance: AxiosInstance;
  private requestQueue = new Set<string>();
  private pendingControllers = new Map<string, AbortController>();
  private inflightGetRequests = new Map<string, Promise<unknown>>();
  /** 防止多个并发 401 重复触发 toast + redirect */
  private _unauthorizedHandling = false;
  /** 单飞 refresh：并发 401 时只刷新一次 */
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
      timeout: 30_000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // ================= 拦截器 =================

  private setupInterceptors() {
    // 请求拦截
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const skipRefresh = config.headers['x-skip-auth-refresh'];
        const method = (config.method || 'get').toLowerCase();

        // 1. token
        const token = this.getToken();
        if (token && !skipRefresh) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 2. 语言
        const lang = this.getLanguage();
        if (lang) {
          config.headers['Accept-Language'] = lang;
        }

        // 3. 去重请求 key
        if (method !== 'get') {
          const key = this.genKey(config);
          if (this.requestQueue.has(key)) {
            const oldController = this.pendingControllers.get(key);
            if (oldController) {
              oldController.abort();
            }
            console.warn('[HTTP] duplicate request replaced:', key);
          }

          const controller = new AbortController();
          config.signal = controller.signal;
          this.pendingControllers.set(key, controller);
          this.requestQueue.add(key);
        }

        // 4. dev 日志
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[HTTP Request] ${config.method?.toUpperCase()} ${config.url}`,
            config.params || config.data || '',
          );
        }

        return config;
      },
      (error) => {
        console.error('[HTTP Request Error]', error);
        return Promise.reject(error);
      },
    );

    // 响应拦截
    this.instance.interceptors.response.use(
      async (res: AxiosResponse<ApiResponse>) => {
        const method = (res.config.method || 'get').toLowerCase();
        if (method !== 'get') {
          const key = this.genKey(res.config);
          this.requestQueue.delete(key);
          this.pendingControllers.delete(key);
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[HTTP Response] ${res.config.method?.toUpperCase()} ${res.config.url}`,
            res.data,
          );
        }

        const { data } = res;
        // 这里按你的后台约定调整：10000 / 200 / 0 等
        if (data.code === 10000 || data.code === 200) {
          return res;
        }

        // 业务错误
        if (data.code === 401) {
          const retryConfig = res.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
          };
          // 已重试过则直接登出，防止无限 refresh 循环
          if (retryConfig._retry) {
            await this.handleUnauthorized();
            return Promise.reject(data);
          }
          return this.handle401AndRetry(retryConfig);
        }

        this.handleBizError(data);
        return Promise.reject(data);
      },
      async (error) => {
        if (error.config) {
          const method = (error.config.method || 'get').toLowerCase();
          if (method !== 'get') {
            const key = this.genKey(error.config);
            this.requestQueue.delete(key);
            this.pendingControllers.delete(key);
          }

          const config = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
          };
          if (
            error.response?.status === 401 &&
            !config._retry &&
            !config.headers['x-skip-auth-refresh']
          ) {
            return this.handle401AndRetry(config);
          }
        }
        this.handleHttpError(error);
        return Promise.reject(error);
      },
    );
  }

  // ================= 工具函数 =================

  private genKey(config: AxiosRequestConfig) {
    const { method, url, params, data } = config;
    return `${method}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setAuthTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem('auth_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  private getLanguage(): string {
    return localStorage.getItem('lang') || 'en';
  }

  // ================= 错误处理 =================

  private handleBizError(data: ApiResponse) {
    // 401 单独处理，不再额外弹 toast
    if (data.code === 401) {
      void this.handleUnauthorized();
      return;
    }

    const fallbackMap: Record<number, string> = {
      400: 'Bad Request',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
    };

    const msg =
      data.message || fallbackMap[data.code] || `业务错误（${data.code}）`;

    this.toastError(msg);
  }

  private handleHttpError(error: any) {
    if (axios.isCancel(error) || error instanceof CanceledError) {
      console.log('[HTTP] request cancelled:', error.message);
      return;
    }

    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        // x-skip-auth-refresh 的内部请求（refresh / set-cookie / clear-cookie）
        // 不再重复触发登出——它们的 401 由调用方统一处理
        if (!error.config?.headers?.['x-skip-auth-refresh']) {
          void this.handleUnauthorized();
        }
        return;
      }

      const msg = data?.message || `Server Error: ${error.message}`;
      this.toastError(msg);
    } else if (error.request) {
      this.toastError('No response from server, please check your network');
    } else {
      this.toastError(error.message || 'Unexpected error occurred');
    }

    console.error('[HTTP Error]', error);
  }

  private async handleUnauthorized() {
    // 多个并发请求同时 401 时，只处理一次
    if (this._unauthorizedHandling) return;
    this._unauthorizedHandling = true;

    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');

    if (window.location.pathname !== '/login') {
      this.toastError('Unauthorized, please log in again');
      // 必须先清除 HTTP-only Cookie，否则 middleware 看到 Cookie 还在，
      // 会把 /login 重定向回 /，导致 Sidebar polling 死循环
      await this.instance
        .post(
          '/v1/auth/admin/clear-cookie',
          {},
          { headers: { 'x-skip-auth-refresh': '1' } },
        )
        .catch(() => {}); // 忽略错误，清不掉也要跳转
      window.location.href = '/login';
    }

    queueMicrotask(() => {
      this._unauthorizedHandling = false;
    });
  }

  private async handle401AndRetry(
    config: InternalAxiosRequestConfig & { _retry?: boolean },
  ) {
    const accessToken = await this.refreshAccessToken();
    if (!accessToken) {
      await this.handleUnauthorized();
      return Promise.reject(new Error('Unauthorized'));
    }

    config._retry = true;
    config.headers.Authorization = `Bearer ${accessToken}`;
    return this.instance.request(config);
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshRes = await this.instance.post<
          ApiResponse<{
            tokens: { accessToken: string; refreshToken: string };
          }>
        >(
          '/v1/auth/admin/refresh',
          { refreshToken },
          {
            headers: {
              'x-skip-auth-refresh': '1',
            },
          },
        );

        const newAccessToken = refreshRes.data.data.tokens.accessToken;
        const newRefreshToken = refreshRes.data.data.tokens.refreshToken;
        this.setAuthTokens(newAccessToken, newRefreshToken);

        // 同步刷新 HTTP-only cookie，SSR 中间件可继续读到有效 token
        await this.instance
          .post(
            '/v1/auth/admin/set-cookie',
            { token: newAccessToken },
            { headers: { 'x-skip-auth-refresh': '1' } },
          )
          .catch((e) => {
            console.warn('[HTTP] set-cookie after refresh failed', e);
          });

        return newAccessToken;
      } catch (error) {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ================= Toast 封装 =================

  private toastError(message: string) {
    const { addToast } = useToastStore.getState();
    addToast('error', message);
  }

  private traceRequest<T>(
    method: string,
    url: string,
    config: RequestConfig | undefined,
    fn: () => Promise<T>,
  ): Promise<T> {
    const trace = config?.trace;

    if (trace === false) {
      return fn();
    }

    const traceConfig: RequestTraceConfig | undefined =
      typeof trace === 'object' ? trace : undefined;

    if (traceConfig?.enabled === false) {
      return fn();
    }

    return withHttpClientSpan(
      traceConfig?.name ?? SENTRY_SPAN_NAME.HTTP_CLIENT_REQUEST,
      {
        [SENTRY_SPAN_ATTR_KEY.HTTP_METHOD]: method.toUpperCase(),
        [SENTRY_SPAN_ATTR_KEY.HTTP_ROUTE]: url,
        ...traceConfig?.attributes,
      },
      fn,
    );
  }

  // ================= 对外 HTTP 方法 =================

  public async get<T = any>(
    url: string,
    params?: any,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    const mergedConfig = {
      params,
      ...config,
    };
    const key = this.genKey({
      method: 'get',
      url,
      params: mergedConfig.params,
      data: mergedConfig.data,
    });

    const existing = this.inflightGetRequests.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const requestPromise = this.traceRequest('get', url, config, async () => {
      return this.instance
        .get<ApiResponse<T>>(url, mergedConfig)
        .then((res) => res.data.data)
        .finally(() => {
          this.inflightGetRequests.delete(key);
        });
    });

    this.inflightGetRequests.set(key, requestPromise);
    return requestPromise;
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    const res = await this.traceRequest('post', url, config, () =>
      this.instance.post<ApiResponse<T>>(url, data, config),
    );
    return res.data.data;
  }

  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    const res = await this.traceRequest('put', url, config, () =>
      this.instance.put<ApiResponse<T>>(url, data, config),
    );
    return res.data.data;
  }

  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    const res = await this.traceRequest('patch', url, config, () =>
      this.instance.patch<ApiResponse<T>>(url, data, config),
    );
    return res.data.data;
  }

  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    const res = await this.traceRequest('delete', url, config, () =>
      this.instance.delete<ApiResponse<T>>(url, config),
    );
    return res.data.data;
  }

  public async upload<T = any>(
    url: string,
    file: File | FormData,
    onProgress?: (percent: number) => void,
    config?: RequestConfig,
  ): Promise<T> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) formData.append('file', file);

    const res = await this.traceRequest('post', url, config, () =>
      this.instance.post<ApiResponse<T>>(url, formData, {
        ...config,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e_1) => {
          if (onProgress && e_1.total) {
            const percent_1 = Math.round((e_1.loaded * 100) / e_1.total);
            onProgress(percent_1);
          }
        },
      }),
    );
    return res.data.data;
  }

  public async download(
    url: string,
    filename = 'download',
    config?: RequestConfig,
  ): Promise<void> {
    const res = await this.traceRequest('get', url, config, () =>
      this.instance.get(url, { responseType: 'blob', ...config }),
    );
    const blob = new Blob([res.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }
}

export const http = new HttpClient();
export default http;
