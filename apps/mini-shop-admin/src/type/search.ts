// 定义支持的表单类型
export type FieldType = 'input' | 'select' | 'date';

// 定义下拉选项
export interface Option {
  label: string;
  value: string | number;
}

// 🔥 核心：单个字段的配置结构
export interface SearchFieldSchema {
  /** 字段对应后端接口的 key (例如 'title', 'status') */
  key: string;
  /** 显示的标签 (例如 '搜索标题') */
  label: string;
  /** 表单类型 */
  type: FieldType;
  /** 占位符 */
  placeholder?: string;
  /** 初始默认值 */
  defaultValue?: any;
  /** 仅对 select 有效：选项列表 */
  options?: Option[];
  /** 额外的样式类名 (用于控制宽度等) */
  className?: string;
}
