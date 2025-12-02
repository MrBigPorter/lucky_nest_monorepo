import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse, ApiError, RequestConfig } from './types.ts';

/**
 * HTTP 请求拦截器
 */
class HttpClient {
  private instance: AxiosInstance;
  private requestQueue: Set<string> = new Set();

  constructor() {
    // 创建 axios 实例
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 注册拦截器
    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 添加认证 token
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加语言设置
        const lang = this.getLanguage();
        if (lang) {
          config.headers['Accept-Language'] = lang;
        }

        // 添加请求 ID（用于取消重复请求）
        const requestKey = this.generateRequestKey(config);
        if (this.requestQueue.has(requestKey)) {
          console.warn('重复请求被取消:', requestKey);
          // 可以选择取消请求或继续
        }
        this.requestQueue.add(requestKey);

        // 打印请求日志（开发环境）
        if (import.meta.env.DEV) {
          console.log(
            `[HTTP Request] ${config.method?.toUpperCase()} ${config.url}`,
            config.data || config.params,
          );
        }

        return config;
      },
      (error) => {
        console.error('[HTTP Request Error]:', error);
        return Promise.reject(error);
      },
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // 移除请求队列
        const requestKey = this.generateRequestKey(response.config);
        this.requestQueue.delete(requestKey);

        // 打印响应日志（开发环境）
        if (import.meta.env.DEV) {
          console.log(
            `[HTTP Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
            response.data,
          );
        }

        const { data } = response;

        // 统一处理业务状态码
        if (data.code === 0 || data.code === 200) {
          return response;
        }

        // 业务错误处理
        this.handleBusinessError(data);
        return Promise.reject(data);
      },
      (error) => {
        // 移除请求队列
        if (error.config) {
          const requestKey = this.generateRequestKey(error.config);
          this.requestQueue.delete(requestKey);
        }

        // HTTP 错误处理
        this.handleHttpError(error);
        return Promise.reject(error);
      },
    );
  }

  /**
   * 生成请求唯一标识
   */
  private generateRequestKey(config: AxiosRequestConfig): string {
    const { method, url, params, data } = config;
    return `${method}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
  }

  /**
   * 获取认证 token
   */
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * 获取语言设置
   */
  private getLanguage(): string {
    return localStorage.getItem('lang') || 'en';
  }

  /**
   * 处理业务错误
   */
  private handleBusinessError(data: ApiResponse) {
    const errorMessages: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权，请重新登录',
      403: '拒绝访问',
      404: '请求资源不存在',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务不可用',
      504: '网关超时',
    };

    const message = data.message || errorMessages[data.code] || '未知错误';

    console.error('[Business Error]:', {
      code: data.code,
      message,
      data: data.data,
    });

    // 特殊错误码处理
    if (data.code === 401) {
      this.handleUnauthorized();
    }

    // 显示错误提示（可集成 toast）
    this.showErrorToast(message);
  }

  /**
   * 处理 HTTP 错误
   */
  private handleHttpError(error: any) {
    if (axios.isCancel(error)) {
      console.log('请求已取消:', error.message);
      return;
    }

    let message = '网络请求失败';

    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;
      message = data?.message || `服务器错误 (${status})`;

      if (status === 401) {
        this.handleUnauthorized();
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message = '网络连接超时，请检查网络';
    } else {
      // 请求配置出错
      message = error.message || '请求配置错误';
    }

    console.error('[HTTP Error]:', error);
    this.showErrorToast(message);
  }

  /**
   * 处理未授权（401）
   */
  private handleUnauthorized() {
    // 清除 token
    localStorage.removeItem('auth_token');

    // 跳转到登录页
    // 注意：这里需要根据实际路由配置调整
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * 显示错误提示
   */
  private showErrorToast(message: string) {
    // 这里可以集成你的 toast 组件
    console.error('[Error Toast]:', message);

    // 示例：如果有全局 toast 方法
    // window.showToast?.({ type: 'error', message });
  }

  /**
   * GET 请求
   */
  public get<T = any>(
    url: string,
    params?: any,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    return this.instance
      .get<ApiResponse<T>>(url, { params, ...config })
      .then((res) => res.data.data);
  }

  /**
   * POST 请求
   */
  public post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    return this.instance
      .post<ApiResponse<T>>(url, data, config)
      .then((res) => res.data.data);
  }

  /**
   * PUT 请求
   */
  public put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    return this.instance
      .put<ApiResponse<T>>(url, data, config)
      .then((res) => res.data.data);
  }

  /**
   * PATCH 请求
   */
  public patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    return this.instance
      .patch<ApiResponse<T>>(url, data, config)
      .then((res) => res.data.data);
  }

  /**
   * DELETE 请求
   */
  public delete<T = any>(
    url: string,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    return this.instance
      .delete<ApiResponse<T>>(url, config)
      .then((res) => res.data.data);
  }

  /**
   * 文件上传
   */
  public upload<T = any>(
    url: string,
    file: File | FormData,
    onProgress?: (percent: number) => void,
  ): Promise<T> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    return this.instance
      .post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(percent);
          }
        },
      })
      .then((res) => res.data.data);
  }

  /**
   * 文件下载
   */
  public download(url: string, filename?: string): Promise<void> {
    return this.instance
      .get(url, {
        responseType: 'blob',
      })
      .then((response) => {
        const blob = new Blob([response.data]);
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename || 'download';
        link.click();
        window.URL.revokeObjectURL(link.href);
      });
  }

  /**
   * 获取原始 axios 实例（用于高级用法）
   */
  public getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

// 导出单例
export const http = new HttpClient();
export default http;

