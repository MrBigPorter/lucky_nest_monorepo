# API 请求拦截器使用指南

## 📁 目录结构

```
api/
├── types.ts       # TypeScript 类型定义
├── http.ts        # HTTP 请求拦截器核心
├── index.ts       # API 接口定义
├── hooks.ts       # React Query Hooks
└── README.md      # 使用文档
```

## 🚀 快速开始

### 1. 环境变量配置

在项目根目录创建 `.env` 文件：

```env
# API 基础路径
VITE_API_BASE_URL=http://localhost:3000/api
```

### 2. 基础使用

#### 直接使用 HTTP 客户端

```typescript
import http from '@/api/http';

// GET 请求
const data = await http.get('/users');

// POST 请求
const result = await http.post('/users', { name: 'John' });

// PUT 请求
await http.put('/users/1', { name: 'Jane' });

// DELETE 请求
await http.delete('/users/1');
```

#### 使用封装好的 API

```typescript
import api from '@/api';

// 获取用户列表
const users = await api.user.getUsers({ page: 1, pageSize: 10 });

// 创建商品
const product = await api.product.createProduct({
  name: 'iPhone 15',
  price: 999,
  category: 'Electronics',
});

// 上传图片
const { url } = await api.upload.uploadImage(file, (percent) => {
  console.log('上传进度:', percent);
});
```

### 3. 使用 React Query Hooks（推荐）

```typescript
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/api/hooks';

function ProductList() {
  // 获取商品列表
  const { data, isLoading, error } = useProducts({ page: 1, pageSize: 10 });

  // 创建商品
  const createMutation = useCreateProduct();

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      name: 'New Product',
      price: 100,
    });
  };

  // 更新商品
  const updateMutation = useUpdateProduct();

  const handleUpdate = async (id: string) => {
    await updateMutation.mutateAsync({
      id,
      data: { name: 'Updated Name' },
    });
  };

  // 删除商品
  const deleteMutation = useDeleteProduct();

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      {data?.list.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## 🔧 功能特性

### 1. 请求拦截

- ✅ 自动添加 Authorization Token
- ✅ 自动添加语言设置
- ✅ 重复请求检测
- ✅ 请求日志打印（开发环境）

### 2. 响应拦截

- ✅ 统一错误处理
- ✅ 业务状态码处理
- ✅ 401 自动跳转登录
- ✅ 响应日志打印（开发环境）

### 3. 文件上传

```typescript
import { uploadApi } from '@/api';

// 上传单个文件
const { url } = await uploadApi.uploadImage(file, (percent) => {
  console.log('上传进度:', percent + '%');
});

// 批量上传
const { urls } = await uploadApi.uploadMultiple([file1, file2, file3]);
```

### 4. 文件下载

```typescript
import http from '@/api/http';

// 下载文件
await http.download('/files/report.pdf', 'report.pdf');
```

## 🎯 高级用法

### 自定义错误处理

```typescript
import http from '@/api/http';

try {
  const data = await http.get('/users');
} catch (error) {
  // 自定义错误处理
  console.error('请求失败:', error);
}
```

### 请求取消

```typescript
import http from '@/api/http';

const controller = new AbortController();

http.get('/users', {}, { signal: controller.signal });

// 取消请求
controller.abort();
```

### 获取原始 axios 实例

```typescript
import http from '@/api/http';

const axiosInstance = http.getAxiosInstance();

// 使用 axios 原生方法
axiosInstance.interceptors.request.use((config) => {
  // 自定义拦截逻辑
  return config;
});
```

## 📝 添加新的 API

在 `api/index.ts` 中添加新的 API 定义：

```typescript
export const orderApi = {
  // 获取订单列表
  getOrders: (params?: PaginationParams) =>
    http.get<PaginatedResponse<Order>>('/orders', params),

  // 获取订单详情
  getOrderById: (id: string) => http.get<Order>(`/orders/${id}`),

  // 创建订单
  createOrder: (data: Partial<Order>) => http.post<Order>('/orders', data),
};
```

然后在 `api/hooks.ts` 中添加对应的 Hook：

```typescript
export const useOrders = (params?: PaginationParams) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => orderApi.getOrders(params),
  });
};
```

## 🔐 认证管理

Token 存储在 `localStorage` 中：

```typescript
// 登录后保存 token
localStorage.setItem('auth_token', 'your-token-here');

// 登出时清除 token
localStorage.removeItem('auth_token');
```

## 🌍 国际化

语言设置存储在 `localStorage` 中：

```typescript
// 设置语言
localStorage.setItem('lang', 'zh-CN');
```

## 📊 错误码说明

| 错误码 | 说明           | 处理方式     |
| ------ | -------------- | ------------ |
| 400    | 请求参数错误   | 显示错误提示 |
| 401    | 未授权         | 跳转登录页   |
| 403    | 拒绝访问       | 显示错误提示 |
| 404    | 资源不存在     | 显示错误提示 |
| 500    | 服务器内部错误 | 显示错误提示 |
| 502    | 网关错误       | 显示错误提示 |
| 503    | 服务不可用     | 显示错误提示 |
| 504    | 网关超时       | 显示错误提示 |

## 🛠️ 集成 Toast 提示

修改 `http.ts` 中的 `showErrorToast` 方法：

```typescript
private showErrorToast(message: string) {
  // 使用你的 toast 组件
  import { toast } from '@/components/ui/toast';
  toast.error(message);
}
```

## 📦 类型定义

所有请求和响应都有完整的 TypeScript 类型支持：

```typescript
import type { ApiResponse, PaginatedResponse } from '@/api/types';

// API 响应格式
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}

// 分页响应格式
interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

## 🎨 最佳实践

1. **使用 React Query Hooks**：优先使用 hooks，自动处理缓存和状态管理
2. **错误边界**：在组件树顶层添加错误边界，捕获 API 错误
3. **Loading 状态**：使用 React Query 提供的 `isLoading` 状态
4. **乐观更新**：使用 `onMutate` 实现乐观更新提升用户体验
5. **类型安全**：充分利用 TypeScript 类型系统，避免运行时错误

## 🐛 调试

开发环境下，所有请求和响应都会在控制台打印：

```
[HTTP Request] GET /users
[HTTP Response] GET /users { code: 0, data: [...] }
```

生产环境下不会打印日志。
