/**
 * 使用 React Query 封装的 API Hooks
 * 提供缓存、自动重试、乐观更新等功能
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, categoryApi, userApi, treasureApi } from './index.ts';
import type { Product, Category, User, TreasureGroup } from '../../types.ts';
import type { PaginationParams } from './types.ts';

/**
 * 商品相关 Hooks
 */
export const useProducts = (params?: PaginationParams & { category?: string }) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productApi.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getProductById(id),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Product>) => productApi.createProduct(data),
    onSuccess: () => {
      // 创建成功后刷新列表
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productApi.updateProduct(id, data),
    onSuccess: (_, variables) => {
      // 更新成功后刷新列表和详情
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

/**
 * 分类相关 Hooks
 */
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getCategories(),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Category>) => categoryApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      categoryApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

/**
 * 用户相关 Hooks
 */
export const useUsers = (params?: PaginationParams) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userApi.getUsers(params),
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userApi.getCurrentUser(),
    staleTime: Infinity, // 当前用户信息不会自动刷新
  });
};

/**
 * 夺宝组相关 Hooks
 */
export const useTreasureGroups = (params?: PaginationParams) => {
  return useQuery({
    queryKey: ['treasureGroups', params],
    queryFn: () => treasureApi.getTreasureGroups(params),
  });
};

export const useTreasureGroup = (id: string) => {
  return useQuery({
    queryKey: ['treasureGroup', id],
    queryFn: () => treasureApi.getTreasureGroupById(id),
    enabled: !!id,
  });
};

export const useCreateTreasureGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<TreasureGroup>) =>
      treasureApi.createTreasureGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasureGroups'] });
    },
  });
};

export const useUpdateTreasureGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TreasureGroup> }) =>
      treasureApi.updateTreasureGroup(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['treasureGroups'] });
      queryClient.invalidateQueries({ queryKey: ['treasureGroup', variables.id] });
    },
  });
};

