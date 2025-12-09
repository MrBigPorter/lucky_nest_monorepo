import React, { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Button, BaseSelect } from '@repo/ui';
import { SearchFieldSchema } from '@/type/search.ts';
import { Input } from '@/components/UIComponents.tsx';

interface Props {
  /** 配置数组：告诉组件你要渲染什么 */
  schema: SearchFieldSchema[];
  /** 父组件传入的初始值（用于回显 URL 参数等） */
  initialValues?: Record<string, any>;
  /** 点击搜索的回调 */
  onSearch: (values: Record<string, any>) => void;
  /** 点击重置的回调 */
  onReset?: () => void;
  /** 搜索按钮的加载状态 */
  loading?: boolean;
}

export const SchemaSearchForm: React.FC<Props> = ({
  schema,
  initialValues = {},
  onSearch,
  onReset,
  loading,
}) => {
  // 1. 动态生成初始状态
  const generateInitialState = () => {
    const state: Record<string, any> = { ...initialValues };
    schema.forEach((field) => {
      // 如果父组件没传值，就用 schema 里的默认值，或者空
      if (state[field.key] === undefined) {
        state[field.key] = field.defaultValue ?? '';
      }
    });
    return state;
  };

  const [values, setValues] = useState(generateInitialState);

  // 2. 通用变更处理
  const handleChange = (key: string, val: any) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  // 3. 搜索与重置
  const handleTrigger = () => onSearch(values);

  const handleReset = () => {
    const resetState: Record<string, any> = {};
    schema.forEach((field) => {
      // 重置时，如果有默认值（比如状态默认查全部），要恢复默认值
      resetState[field.key] = field.defaultValue ?? '';
    });
    setValues(resetState);
    onReset && onReset();
  };

  // 4. 渲染工厂函数：根据 type 渲染不同组件
  const renderField = (field: SearchFieldSchema) => {
    switch (field.type) {
      case 'input':
        return (
          <Input
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            value={values[field.key]}
            onChange={(e) => handleChange(field.key, e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && handleTrigger()}
          />
        );
      case 'select':
        return (
          <BaseSelect
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            options={field.options || []}
            value={values[field.key]}
            onChange={(val) => handleChange(field.key, val)}
          />
        );
      // 将来可以在这里加 case 'date-picker' ...
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-white/5 p-4 rounded-lg border border-gray-100 dark:border-white/10 mb-4">
      {/* 自动响应式布局：PC端一行3个或4个 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
        {/* 循环渲染所有字段 */}
        {schema.map((field) => (
          <div key={field.key} className={field.className}>
            {renderField(field)}
          </div>
        ))}

        <div className="flex gap-2">
          <Button onClick={handleTrigger} isLoading={loading}>
            <Search size={16} className="mr-2" /> Search
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
