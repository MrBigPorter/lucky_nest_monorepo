import React, { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Button, BaseSelect } from '@repo/ui';
import { SearchFieldSchema } from '@/type/search.ts';
import { Input } from '@/components/UIComponents.tsx';

//  泛型 T 限制为对象，且值通常是 string 或 number
interface Props<T extends Record<string, string | number | undefined>> {
  schema: SearchFieldSchema<T>[];
  initialValues?: Partial<T>;
  onSearch: (values: T) => void;
  onReset?: () => void;
  loading?: boolean;
}

export const SchemaSearchForm = <
  T extends Record<string, string | number | undefined>,
>({
  schema,
  initialValues = {},
  onSearch,
  onReset,
  loading,
}: Props<T>) => {
  // 1. 初始化状态
  const generateInitialState = (): T => {
    // 这里用 as T 强制断言，因为动态构建对象 TS 很难推断
    const state = { ...initialValues } as T;

    schema.forEach((field) => {
      const key = field.key;
      // 只有当值不存在时才使用默认值
      if (state[key] === undefined) {
        // 使用类型断言告诉 TS，defaultValue 是安全的
        state[key] = (field.defaultValue ?? '') as T[keyof T];
      }
    });
    return state;
  };

  const [values, setValues] = useState<T>(generateInitialState);

  // 2. 变更处理
  const handleChange = <K extends keyof T>(key: K, val: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  // 3. 触发与重置
  const handleTrigger = () => onSearch(values);

  const handleReset = () => {
    const resetState = {} as T;
    schema.forEach((field) => {
      // 同样断言 defaultValue
      resetState[field.key] = (field.defaultValue ?? '') as T[keyof T];
    });
    setValues(resetState);
    onReset?.();
    // 通常重置后也希望自动触发一次搜索
    onSearch(resetState);
  };

  // 4. 渲染字段
  const renderField = (field: SearchFieldSchema<T>) => {
    // 获取当前值，处理 undefined 情况
    const currentValue = values[field.key] ?? '';

    switch (field.type) {
      case 'input':
        return (
          <Input
            key={String(field.key)}
            label={field.label}
            placeholder={field.placeholder}
            // 强制转 string，因为 Input 组件 value 只收 string
            value={String(currentValue)}
            onChange={(e) =>
              handleChange(field.key, e.target.value as T[keyof T])
            }
            onKeyDown={(e: React.KeyboardEvent) =>
              e.key === 'Enter' && handleTrigger()
            }
          />
        );
      case 'select':
        return (
          <BaseSelect
            key={String(field.key)}
            label={field.label}
            placeholder={field.placeholder}
            // 这里不再报错，因为我们在 type 定义里统一了
            options={field.options || []}
            // BaseSelect 要求 value 是 string
            value={String(currentValue)}
            onChange={(val) => handleChange(field.key, val as T[keyof T])}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4  mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
        {schema.map((field) => (
          <div key={String(field.key)} className={field.className}>
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
