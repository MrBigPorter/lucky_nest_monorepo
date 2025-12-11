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
  actSectionWithProducts,
  actSectionBindProducts,
  createActSectionPayload,
  Banner,
  BannerListParams,
  CreateBannerPayload,
  OrderListParams,
  Order,
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
  getProducts: (
    params?: PaginationParams & { categoryId?: number; treasureName?: string },
  ) => http.get<PaginatedResponse<Product>>('/v1/admin/treasure/list', params),

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
  updateProductState: (id: string, state: number) =>
    http.patch<Product>(`/v1/admin/treasure/${id}/state`, { state }),

  // 更新商品排序
  updateProductOrder: (id: string, sortOrder: number) =>
    http.patch<Product>(`/products/${id}/order`, { sortOrder }),
};

/**
 * banner API
 */
export const bannerApi = {
  // 获取 banner 列表
  getList: (params?: BannerListParams) =>
    http.get<PaginatedResponse<Banner>>('/v1/admin/banners/list', params),

  //获取 banner 详情
  getBannerById: (id: string) => http.get<Banner>(`/v1/admin/banners/${id}`),

  // 创建banner
  create: (data: CreateBannerPayload) =>
    http.post<Banner>('/v1/admin/banners/create', data),

  // 更新banner信息
  update: (id: string, data: Partial<CreateBannerPayload>) =>
    http.patch<Banner>(`/v1/admin/banners/${id}`, data),

  // 更新banner状态
  updateState: (id: string, state: number) =>
    http.patch<Banner>(`/v1/admin/banners/${id}/state`, { state }),

  // 删除banner
  delete: (id: string) => http.delete<Banner>(`/v1/admin/banners/${id}`),
};

/**
 * 订单相关 API
 */
export const orderApi = {
  // 获取订单列表
  getList: (params?: OrderListParams) =>
    http.get<PaginatedResponse<Order>>('/v1/admin/order/list', params),

  // 获取订单详情
  getOrderDetailById: (id: string) => http.get<Order>(`/v1/admin/order/${id}`),

  // 更新订单状态
  updateState: (id: string, state: number) =>
    http.patch<Order>(`/v1/admin/order/${id}/status`, { state }),

  // 删除order
  delete: (id: string) => http.delete<Order>(`/v1/admin/order/${id}`),
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
 * 活动专区管理列表页 API
 */
export const actSectionApi = {
  // 获取列表
  getList: (params: PaginationParams) => {
    console.log('Fetching act section list with params:', params);
    return http.get<PaginatedResponse<actSectionWithProducts>>(
      '/v1/admin/act-sections/list',
      params,
    );
  },

  // 获取详情
  getDetail: (id: string) => {
    return http.get<actSectionWithProducts>(`/v1/admin/act-sections/${id}`);
  },

  // 创建
  create: (data: createActSectionPayload) => {
    return http.post('/v1/admin/act-sections/create', data);
  },

  // 更新
  update: (id: string, data: Partial<createActSectionPayload>) => {
    return http.patch(`/v1/admin/act-sections/${id}`, data);
  },

  // 删除
  delete: (id: string) => {
    return http.delete(`/v1/admin/act-sections/${id}`);
  },

  // 绑定商品到活动区域
  bindProduct: (id: string, data: actSectionBindProducts) => {
    return http.post(`/v1/admin/act-sections/${id}/bind`, data);
  },

  // 解绑定商品
  unbindProduct: (id: string, treasureId: string) => {
    return http.delete(`/v1/admin/act-sections/${id}/unbind/${treasureId}`);
  },

  // 更新排序
  /* updateSortOrder: (data: UpdateSortOrderDto) => {
    return request.post('/admin/act-section/sort-order', data);
  },*/
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
