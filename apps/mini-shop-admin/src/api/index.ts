/**
 * API 接口定义示例
 * 使用方法：根据后端接口定义具体的 API 方法
 */

import http from './http';
import type { PaginatedResponse, PaginationParams } from './types.ts';
import {
  Product,
  Category,
  User,
  TreasureGroup,
  LoginResponse,
  AdminUser,
  AdminCreateUser,
  AdminUpdateUser,
  CreateProduct,
} from '@/type/types.ts';

/**
 * 用户相关 API
 */
export const userApi = {
  // 获取用户列表
  getUsers: (params?: PaginationParams) =>
    http.get<PaginatedResponse<AdminUser>>('/v1/admin/user/list', params),

  // 获取用户详情
  getUserById: (id: string) => http.get<User>(`/v1/admin/user/${id}`),

  // 创建用户
  createUser: (data: AdminCreateUser) =>
    http.post<User>('/v1/admin/user/create', data),

  // 更新用户
  updateUser: (id: string, data: Partial<AdminUpdateUser>) =>
    http.patch<AdminUser>(`/v1/admin/user/${id}`, data),

  // 删除用户
  deleteUser: (id: string) => http.delete(`/v1/admin/user/${id}`),
};

/**
 * 商品相关 API
 */
export const productApi = {
  // 获取商品列表
  getProducts: (params?: PaginationParams & { categoryId?: number }) =>
    http.get<PaginatedResponse<Product>>('/v1/admin/treasure/list', params),

  // 获取商品详情
  getProductById: (id: string) => http.get<Product>(`/v1/admin/treasure/${id}`),

  // 创建商品
  createProduct: (data: CreateProduct) =>
    http.post<Product>('/v1/admin/treasure/create', data),

  // 更新商品
  updateProduct: (id: string, data: Partial<CreateProduct>) =>
    http.patch<Product>(`/v1/admin/treasure/${id}`, data),

  // 删除商品
  deleteProduct: (id: string) => http.delete(`v1/admin/treasure/${id}`),

  // 更新商品状态
  updateProductStatus: (id: string, status: 'active' | 'draft' | 'ended') =>
    http.patch<Product>(`/products/${id}/status`, { status }),

  // 更新商品排序
  updateProductOrder: (id: string, sortOrder: number) =>
    http.patch<Product>(`/products/${id}/order`, { sortOrder }),
};

/**
 * 分类相关 API
 */
export const categoryApi = {
  // 获取分类列表
  getCategories: () => http.get<Category[]>('/v1/admin/category/list'),

  // 获取分类详情
  getCategoryById: (id: string) => http.get<Category>(`/category/${id}`),

  // 创建分类
  createCategory: (data: Partial<Omit<Category, 'productCount'>>) =>
    http.post<Category>('/v1/admin/category/create', data),

  // 更新分类
  updateCategory: (id: string, data: Partial<Category>) =>
    http.patch<Category>(`/v1/admin/category/${id}`, data),

  // 删除分类
  deleteCategory: (id: string) => http.delete(`/v1/admin/category/${id}`),

  // 禁用，启用分类
  toggleCategoryStatus: (id: string) =>
    http.patch<Category>(`/v1/admin/category/${id}/state`),
};

/**
 * 夺宝组相关 API
 */
export const treasureApi = {
  // 获取夺宝组列表
  getTreasureGroups: (params?: PaginationParams) =>
    http.get<PaginatedResponse<TreasureGroup>>('/treasure-groups', params),

  // 获取夺宝组详情
  getTreasureGroupById: (id: string) =>
    http.get<TreasureGroup>(`/treasure-groups/${id}`),

  // 创建夺宝组
  createTreasureGroup: (data: Partial<TreasureGroup>) =>
    http.post<TreasureGroup>('/treasure-groups', data),

  // 更新夺宝组
  updateTreasureGroup: (id: string, data: Partial<TreasureGroup>) =>
    http.put<TreasureGroup>(`/treasure-groups/${id}`, data),

  // 删除夺宝组
  deleteTreasureGroup: (id: string) => http.delete(`/treasure-groups/${id}`),

  // 开始/暂停夺宝
  toggleTreasureStatus: (id: string) =>
    http.post(`/treasure-groups/${id}/toggle`),
};

/**
 * 认证相关 API
 */
export const authApi = {
  // 登录
  login: (data: { username: string; password: string }) =>
    http.post<LoginResponse>('/v1/auth/admin/login', data),

  // 登出
  logout: () => http.post('/v1/auth/admin/logout'),

  // 刷新 token
  refreshToken: () => http.post<{ token: string }>('/auth/refresh-token'),

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    http.post('/auth/change-password', data),
};

/**
 * 文件上传 API
 */
export const uploadApi = {
  // 上传文件
  uploadMedia: (file: File, onProgress?: (percent: number) => void) =>
    http.upload<{ url: string }>('/v1/admin/upload/image', file, onProgress),

  // 批量上传
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    return http.upload<{ urls: string[] }>('/upload/multiple', formData);
  },
};

/**
 * 统计相关 API
 */
export const statsApi = {
  // 获取仪表盘统计数据
  getDashboardStats: () =>
    http.get<{
      totalUsers: number;
      activeProducts: number;
      totalRevenue: number;
      totalOrders: number;
    }>('/stats/dashboard'),

  // 获取销售趋势
  getSalesTrend: (params: { startDate: string; endDate: string }) =>
    http.get<Array<{ date: string; revenue: number; orders: number }>>(
      '/stats/sales-trend',
      params,
    ),
};

// 导出所有 API
export default {
  user: userApi,
  product: productApi,
  category: categoryApi,
  treasure: treasureApi,
  auth: authApi,
  upload: uploadApi,
  stats: statsApi,
};
