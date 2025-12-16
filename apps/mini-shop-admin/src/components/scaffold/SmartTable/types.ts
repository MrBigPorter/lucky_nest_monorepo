import { ReactNode } from 'react';

// 1. 支持的数值类型 (增加了 dateRange)
export type ValueType =
  | 'text'
  | 'money'
  | 'date'
  | 'dateTime'
  | 'dateRange'
  | 'select'
  | 'option'
  | 'index';

// 2. ActionRef 定义
export type ActionType = {
  reload: (resetPageIndex?: boolean) => void;
  reset: () => void;
};

// 3. 请求函数定义
export type RequestData<T> = (params: {
  pageSize: number;
  page: number;
  [key: string]: any;
}) => Promise<{
  data: T[];
  total: number;
  success?: boolean;
}>;

// 4. 列定义 (增加了 copyable 和 formItemProps)
export type ProColumns<T = any> = {
  title: string;
  dataIndex?: keyof T | string;
  width?: number;
  valueType?: ValueType;

  // ✨ 新增：支持复制
  copyable?: boolean;

  // 枚举映射
  valueEnum?: Record<
    string | number,
    { text: string; status?: string; color?: string }
  >;

  // 搜索配置
  search?:
    | boolean
    | {
        order?: number;
        title?: string;
        valueType?: ValueType;
        transform?: (value: any) => any;
        // ✨ 新增：透传给 FormItem 的属性 (如 placeholder)
        formItemProps?: Record<string, any>;
      };

  hideInTable?: boolean;
  hideInSearch?: boolean;

  render?: (
    dom: ReactNode,
    entity: T,
    index: number,
    action?: ActionType,
  ) => ReactNode;
};
