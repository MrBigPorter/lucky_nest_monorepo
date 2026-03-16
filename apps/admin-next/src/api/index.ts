/**
 * API 接口定义示例
 * 使用方法：根据后端接口定义具体的 API 方法
 */

import http from './http';
import type { PaginatedResponse, PaginationParams } from './types';
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
  Coupon,
  CreateCouponPayload,
  CouponListParams,
  TransactionsListParams,
  WalletTransaction,
  WithdrawListParams,
  ManualAdjustPayload,
  AuditWithdrawPayload,
  WithdrawOrder,
  RechargeOrder,
  RechargeListParams,
  FinanceStatistics,
  QueryListAddressParams,
  AddressResponse,
  UpdateAddress,
  Province,
  City,
  Barangay,
  KycRecordListParams,
  AuditKycParams,
  ProductListParams,
  QueryClientUserParams,
  ClientUserListItem,
  ClientUserDevice,
  ClientUserDetail,
  BanDeviceParams,
  UpdateUserStatusParams,
  PaymentChannelListParams,
  PaymentChannel,
  CreatePaymentChannelPayload,
  AdminCreateKycParams,
  AdminUpdateKycParams,
} from '@/type/types';

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
 * 客户端用户相关 API
 */
export const clientUserApi = {
  // 获取用户列表
  getUsers: (params?: QueryClientUserParams) =>
    http.get<PaginatedResponse<ClientUserListItem>>(
      '/v1/admin/client-user/list',
      params,
    ),

  // 获取用户设备列表
  getDevices: (userId: string) =>
    http.get<PaginatedResponse<ClientUserDevice>>(
      `/v1/admin/client-user/${userId}/devices`,
    ),

  // 获取用户详情
  getUserById: (id: string) =>
    http.get<ClientUserDetail>(`/v1/admin/client-user/${id}`),

  // 封禁设备
  banDevice: (data: BanDeviceParams) =>
    http.post<User>('/v1/admin/client-user/device/ban', data),

  // 更新用户
  updateUser: (id: string, data: Partial<UpdateUserStatusParams>) =>
    http.patch<AdminUser>(`/v1/admin/client-user/${id}/status`, data),

  // 解封设备
  unbanDevice: (id: string) =>
    http.delete(`/v1/admin/client-user/device/unban/${id}`),
};

/**
 * 商品相关 API
 */
export const productApi = {
  // 获取商品列表
  getProducts: (params?: ProductListParams) =>
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
  updateProductState: (id: string, state: number) =>
    http.patch<Product>(`/v1/admin/treasure/${id}/state`, { state }),

  // 更新商品排序
  updateProductOrder: (id: string, sortOrder: number) =>
    http.patch<Product>(`/products/${id}/order`, { sortOrder }),

  pureHomeCache: () => http.post('v1/admin/treasure/purge-home-cache'),
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
    http.patch<Order>(`/v1/admin/order/${id}/status`, state),

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
 * 拼团管理 API (Admin)
 */
export const groupApi = {
  // 获取拼团列表
  getList: (params?: import('@/type/types').AdminGroupListParams) =>
    http.get<PaginatedResponse<import('@/type/types').AdminGroupItem>>(
      '/v1/admin/groups/list',
      params,
    ),

  // 获取拼团详情
  getDetail: (groupId: string) =>
    http.get<import('@/type/types').AdminGroupDetail>(
      `/v1/admin/groups/${groupId}`,
    ),
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
 * 支付渠道管理列表页 API
 */
export const paymentChannelApi = {
  // 获取列表
  getList: (params: PaymentChannelListParams) => {
    console.log('Fetching act section list with params:', params);
    return http.get<PaginatedResponse<PaymentChannel>>(
      '/v1/admin/payment/channels/list',
      params,
    );
  },

  // 创建
  create: (data: CreatePaymentChannelPayload) => {
    return http.post('/v1/admin/payment/channels/create', data);
  },

  // 更新
  update: (id: number, data: Partial<CreatePaymentChannelPayload>) => {
    return http.patch(`/v1/admin/payment/channels/${id}`, data);
  },

  // 删除
  delete: (id: number, status: number) => {
    return http.delete(`/v1/admin/payment/channels/${id}/${status}`);
  },
};

/**
 * 优惠券专区 管理列表页 API
 */
export const couponApi = {
  // 获取列表
  getList: (params: CouponListParams) => {
    return http.get<PaginatedResponse<Coupon>>(
      '/v1/admin/coupons/list',
      params,
    );
  },

  // 获取详情
  getDetail: (id: string) => {
    return http.get<Coupon>(`/v1/admin/coupons/${id}`);
  },

  // 创建
  create: (data: CreateCouponPayload) => {
    return http.post('/v1/admin/coupons/create', data);
  },

  // 更新
  update: (id: string, data: Partial<CreateCouponPayload>) => {
    return http.patch(`v1/admin/coupons/${id}`, data);
  },

  // 删除
  delete: (id: string) => {
    return http.delete(`/v1/admin/coupons/${id}`);
  },
};

/**
 * 财务专区 API
 */
export const financeApi = {
  // 获取交易记录列表
  getTransactions: (params: TransactionsListParams) => {
    return http.get<PaginatedResponse<WalletTransaction>>(
      '/v1/admin/finance/transactions',
      params,
    );
  },

  // 获取提现记录列表
  getWithdrawals: (params: WithdrawListParams) => {
    return http.get<PaginatedResponse<WithdrawOrder>>(
      `/v1/admin/finance/withdrawals`,
      params,
    );
  },

  // 提现审核
  withdrawalsAudit: (data: AuditWithdrawPayload) => {
    return http.post('/v1/admin/finance/withdrawals/audit', data);
  },

  // 余额调整
  adjust: (data: Partial<ManualAdjustPayload>) => {
    return http.post(`/v1/admin/finance/adjust`, data);
  },

  // 存款记录列表
  getDeposits: (params: RechargeListParams) => {
    return http.get<PaginatedResponse<RechargeOrder>>(
      '/v1/admin/finance/recharges',
      params,
    );
  },

  // 获取统计数据
  getStatistics: () => {
    return http.get<FinanceStatistics>('/v1/admin/finance/statistics');
  },

  // 同步充值状态
  syncRecharge: (id: string) => {
    return http.post(`/v1/admin/finance/recharge/sync/${id}`);
  },
};

/**
 * 地址管理 API
 */
export const addressApi = {
  // 获取地址列表
  list: (params: QueryListAddressParams) => {
    return http.get<PaginatedResponse<AddressResponse>>(
      '/v1/admin/address/list',
      params,
    );
  },

  // 获取地址详情
  getAddress: (id: string) => {
    return http.get<AddressResponse>(`/v1/admin/address/${id}`);
  },

  // 更新地址
  updateAddress: (id: string, data: UpdateAddress) => {
    return http.post<AddressResponse>(`/v1/admin/address/update/${id}`, data);
  },

  // 删除地址
  deleteAddress: (id: string) => {
    return http.delete(`/v1/admin/address/delete/${id}`);
  },
};

/**
 * region API
 */
export const regionApi = {
  // 获取省份列表
  provinces: () => {
    return http.get<Province[]>('/v1/admin/region/provinces');
  },

  // 获取城市列表
  cities: (provinceId: number) => {
    return http.get<City[]>(`/v1/admin/region/cities/${provinceId}`);
  },

  // 获取区/镇列表
  barangays: (cityId: number) => {
    return http.get<Barangay[]>(`/v1/admin/region/barangays/${cityId}`);
  },
};

/**
 * kyc API
 */
export const kycApi = {
  // ==================== 原有接口 ====================

  // 获取 KYC 列表
  getRecords: (params: KycRecordListParams) => {
    return http.get('/v1/admin/kyc/records', params);
  },

  // 获取详情
  getDetail: (id: string) => {
    return http.get(`/v1/admin/kyc/records/${id}`);
  },

  // 审核 (Pass / Reject)
  // 注意：这里 id 通常是 kycId
  audit: (id: string, data: AuditKycParams) => {
    return http.post(`/v1/admin/kyc/${id}/audit`, data);
  },

  // ==================== 新增接口 ====================

  /**
   * [增] 管理员手动创建 (直接通过)
   * 场景：线下审核、人工录入
   */
  create: (data: AdminCreateKycParams) => {
    return http.post('/v1/admin/kyc/create', data);
  },

  /**
   * [改] 修正 KYC 信息
   * @param userId 注意这里传的是 userId
   * @param data 修改的数据
   */
  updateInfo: (userId: string, data: AdminUpdateKycParams) => {
    return http.put(`/v1/admin/kyc/update/${userId}`, data);
  },

  /**
   * [撤] 撤销/作废认证 (变回 Rejected)
   * @param userId 目标用户ID
   * @param reason 撤销原因
   */
  revoke: (userId: string, reason: string) => {
    return http.post(`/v1/admin/kyc/revoke/${userId}`, { reason });
  },

  /**
   * [删] 物理删除记录 (重置为 Not Verified)
   * @param userId 目标用户ID
   */
  delete: (userId: string) => {
    return http.delete(`/v1/admin/kyc/delete/${userId}`);
  },
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

  // 设置 HTTP-only Cookie（登录成功后调用，由后端写 httpOnly cookie）
  setCookie: (token: string) =>
    http.post<{ ok: boolean }>('/v1/auth/admin/set-cookie', { token }),

  // 清除 HTTP-only Cookie（登出时调用）
  clearCookie: () =>
    http.post<{ ok: boolean }>('/v1/auth/admin/clear-cookie'),

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

/**
 * 操作日志审计 API
 */
export const adminOperationLogApi = {
  // 获取操作日志列表
  getList: (params: import('@/type/types').AdminOperationLogListParams) =>
    http.get<PaginatedResponse<import('@/type/types').AdminOperationLog>>(
      '/v1/admin/operation-logs/list',
      params,
    ),
};
