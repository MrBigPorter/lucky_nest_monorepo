import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../ui/select"; // 👈 引用刚才创建的 select.tsx
import { cn } from "../../../lib/utils";
import { Loader2 } from "lucide-react";

// --- 类型定义 ---
export interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectGroupOption {
  label: string;
  items: SelectOption[];
}

export type BaseSelectOptions = SelectOption[] | SelectGroupOption[];

export interface BaseSelectProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof Select>,
    "value" | "onValueChange"
  > {
  value?: string;
  onChange?: (value: string) => void;
  options: BaseSelectOptions;
  placeholder?: string;
  className?: string; // Trigger 样式
  contentClassName?: string; // 下拉框样式
  containerClassName?: string; // 容器样式
  error?: boolean;
  isLoading?: boolean;
  label?: string; // Label 文本
  emptyText?: string;
}

// 辅助函数：判断是否为分组
function isGrouped(options: BaseSelectOptions): options is SelectGroupOption[] {
  return options.length > 0 && "items" in options[0];
}

export const BaseSelect = React.forwardRef<HTMLButtonElement, BaseSelectProps>(
  (
    {
      value,
      onChange,
      options,
      placeholder = "请选择",
      className,
      contentClassName,
      containerClassName,
      disabled,
      error,
      isLoading,
      label,
      emptyText = "暂无数据",
      ...props
    },
    ref,
  ) => {
    // 强制转换为字符串，避免 value={1} 导致显示不出
    const safeValue =
      value !== undefined && value !== null ? String(value) : undefined;

    return (
      <div className={cn("w-full space-y-2", containerClassName)}>
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
            {label}
          </label>
        )}

        <Select
          value={safeValue}
          onValueChange={onChange}
          disabled={disabled || isLoading}
          {...props}
        >
          <SelectTrigger
            ref={ref}
            className={cn(
              "w-full transition-colors",
              error &&
                "border-destructive/50 text-destructive focus:ring-destructive",
              className,
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <SelectValue placeholder={placeholder} />
            </div>
          </SelectTrigger>

          {/* ⚠️ 这里的 z-[9999] 是为了防止在 Modal 里被遮挡 */}
          <SelectContent
            className={cn("max-h-[300px] z-[9999]", contentClassName)}
          >
            {options.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </div>
            )}

            {isGrouped(options)
              ? options.map((group, index) => (
                  <React.Fragment key={group.label}>
                    <SelectGroup>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.items.map((item) => (
                        <RenderSelectItem key={item.value} item={item} />
                      ))}
                    </SelectGroup>
                    {index < options.length - 1 && <SelectSeparator />}
                  </React.Fragment>
                ))
              : (options as SelectOption[]).map((item) => (
                  <RenderSelectItem key={item.value} item={item} />
                ))}
          </SelectContent>
        </Select>
      </div>
    );
  },
);

BaseSelect.displayName = "BaseSelect";

const RenderSelectItem = ({ item }: { item: SelectOption }) => {
  return (
    // 强制 value 转字符串
    <SelectItem value={String(item.value)} disabled={item.disabled}>
      <div className="flex items-center gap-2">
        {item.icon && (
          <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">
            {item.icon}
          </span>
        )}
        <span className="truncate">{item.label}</span>
      </div>
    </SelectItem>
  );
};
