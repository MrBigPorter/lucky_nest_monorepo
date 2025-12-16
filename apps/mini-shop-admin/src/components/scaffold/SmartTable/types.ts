import { ReactNode } from 'react';

// 支持的智能类型
export type ValueType =
  | 'text'
  | 'money'
  | 'date'
  | 'dateTime'
  | 'select'
  | 'option';

// 状态枚举定义 (用于 select 类型)
export type ValueEnum = Record<
  string | number,
  {
    text: string;
    status:
      | 'success'
      | 'warning'
      | 'error'
      | 'default'
      | 'processing'
      | 'blue'
      | 'green'
      | 'red'
      | 'yellow';
  }
>;

// 扩展 Column 定义
export type SmartColumn<T> = {
  title: string;
  dataIndex?: keyof T | string; // 支持 'user.nickname' 这种写法

  valueType?: ValueType;
  valueEnum?: ValueEnum; // 仅当 valueType 为 'select' 时有效

  width?: number;

  //  核心：自定义渲染
  // dom: 也就是 SmartTable 帮你格式化好的默认内容（比如 "$1,200.00"）
  // row: 整行数据
  render?: (dom: ReactNode, row: T, index: number) => ReactNode;

  // 是否隐藏
  hideInTable?: boolean;
};

// 请求函数的标准化定义
export type RequestData<T> = (params: {
  current: number;
  pageSize: number;
  [key: string]: any; // 允许额外的搜索参数
}) => Promise<{
  data: T[];
  total: number;
  success?: boolean;
}>;
