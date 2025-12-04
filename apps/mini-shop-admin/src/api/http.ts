import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse, RequestConfig } from './types'; // 注意：这里不要写 .ts 后缀
import { useToastStore } from '@/store/useToastStore';

/* eslint-disable @typescript-eslint/no-explicit-any */
class HttpClient {
  private readonly instance: AxiosInstance;
  private requestQueue = new Set<string>();

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
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
        // 1. token
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 2. 语言
        const lang = this.getLanguage();
        if (lang) {
          config.headers['Accept-Language'] = lang;
        }

        // 3. 去重请求 key
        const key = this.genKey(config);
        if (this.requestQueue.has(key)) {
          // 这里你可以选择直接取消请求（需要 axios.CancelToken）
          console.warn('[HTTP] duplicate request:', key);
        }
        this.requestQueue.add(key);

        // 4. dev 日志
        if (import.meta.env.DEV) {
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
      (res: AxiosResponse<ApiResponse>) => {
        const key = this.genKey(res.config);
        this.requestQueue.delete(key);

        if (import.meta.env.DEV) {
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
        this.handleBizError(data);
        return Promise.reject(data);
      },
      (error) => {
        if (error.config) {
          const key = this.genKey(error.config);
          this.requestQueue.delete(key);
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

  private getLanguage(): string {
    return localStorage.getItem('lang') || 'en';
  }

  // ================= 错误处理 =================

  private handleBizError(data: ApiResponse) {
    const fallbackMap: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权，请重新登录',
      403: '没有权限访问该资源',
      404: '请求资源不存在',
      500: '服务器内部错误',
    };

    const msg =
      data.message || fallbackMap[data.code] || `业务错误（${data.code}）`;

    // 401 单独处理
    if (data.code === 401) {
      this.handleUnauthorized();
    }

    this.toastError(msg);
  }

  private handleHttpError(error: any) {
    if (axios.isCancel(error)) {
      console.log('[HTTP] request cancelled:', error.message);
      return;
    }

    let msg = '网络请求失败，请稍后重试';

    if (error.response) {
      const { status, data } = error.response;
      msg = data?.message || `服务器错误（${status}）`;

      if (status === 401) {
        this.handleUnauthorized();
      }
    } else if (error.request) {
      msg = '网络连接超时，请检查网络';
    } else {
      msg = error.message || msg;
    }

    console.error('[HTTP Error]', error);
    this.toastError(msg);
  }

  private handleUnauthorized() {
    // 清 token
    localStorage.removeItem('auth_token');

    // 跳登录
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // ================= Toast 封装 =================

  private toastError(message: string) {
    const { addToast } = useToastStore.getState();
    addToast('error', message);
  }
  // ================= 对外 HTTP 方法 =================

  public async get<T = any>(
    url: string,
    params?: any,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    const res = await this.instance.get<ApiResponse<T>>(url, {
      params,
      ...config,
    });
    return res.data.data;
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    const res = await this.instance.post<ApiResponse<T>>(url, data, config);
    return res.data.data;
  }

  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    const res = await this.instance.put<ApiResponse<T>>(url, data, config);
    return res.data.data;
  }

  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    const res = await this.instance.patch<ApiResponse<T>>(url, data, config);
    return res.data.data;
  }

  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    const res = await this.instance.delete<ApiResponse<T>>(url, config);
    return res.data.data;
  }

  public async upload<T = any>(
    url: string,
    file: File | FormData,
    onProgress?: (percent: number) => void,
  ): Promise<T> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) formData.append('file', file);

    const res = await this.instance.post<ApiResponse<T>>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e_1) => {
        if (onProgress && e_1.total) {
          const percent_1 = Math.round((e_1.loaded * 100) / e_1.total);
          onProgress(percent_1);
        }
      },
    });
    return res.data.data;
  }

  public async download(url: string, filename = 'download'): Promise<void> {
    const res = await this.instance.get(url, { responseType: 'blob' });
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
