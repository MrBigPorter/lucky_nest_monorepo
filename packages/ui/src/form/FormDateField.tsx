import * as React from "react";
import type { FieldValues } from "react-hook-form";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import {
  FormControl,
  FormField,
  FormHelpTextVariants,
  FormInput,
  FormItem, // 注意：移除了 FormInput，改用下方的 Input
  FormLabel,
  FormLabelVariants,
  FormMessage,
  FormMessageVariants,
  HelpText,
} from "./index";
import type { BaseFieldProps } from "./types/baseFieldType";
import { useFormTheme } from "./formTheme/FormThemeProvider";
import { getVariantClassNames } from "./formTheme";
import { twMerge } from "tailwind-merge";
import { cn } from "../lib/utils";

// 确保引用的是 Shadcn 封装后的 Calendar
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Button } from "../components/ui/button";

// 定义模式类型
type DatePickerMode = "single" | "range";

type FormDateFieldProps<TFieldValues extends FieldValues = FieldValues> = Omit<
  BaseFieldProps<TFieldValues>,
  "type" | "inputMode" | "autoComplete" | "renderLeft" | "renderRight" | "data"
> & {
  placeholder?: string;
  /** 选择模式: 单选 or 范围 */
  mode?: DatePickerMode;
  /** 是否显示时间选择 (仅在 single 模式下生效较好，range 建议拆分) */
  showTime?: boolean;
  /** 自定义显示格式 (覆盖默认逻辑) */
  formatValue?: (date: Date | DateRange | undefined) => string;
};

export function FormDateField<TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  renderLabelRight,
  required,
  classNames = {},
  testId,
  size = "md",
  helpText,
  variant = "default",
  layout = "vertical",
  placeholder = "Select date",
  mode = "single",
  showTime = false,
  formatValue,
  disabled,
}: Readonly<FormDateFieldProps<TFieldValues>>) {
  const theme = useFormTheme();
  const [open, setOpen] = React.useState(false);

  // 处理时间变更 (仅 Single 模式)
  const handleTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    currentDate: Date | undefined,
    onChange: (date: Date) => void,
  ) => {
    const timeValue = e.target.value;
    if (!timeValue) return;

    const [hours, minutes] = timeValue.split(":").map(Number);
    const newDate = currentDate ? new Date(currentDate) : new Date();
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    onChange(newDate);
  };

  return (
    <FormField<TFieldValues, typeof name>
      name={name}
      renderAction={({ field, error }) => {
        const finalVariant = error ? "error" : variant;

        // 值的类型可能是 Date (single) 或 DateRange (range)
        const value = field.value as Date | DateRange | undefined;

        // --- 1. 处理显示文本 ---
        let display = placeholder;
        if (value) {
          if (formatValue) {
            display = formatValue(value);
          } else if (mode === "range" && "from" in (value as DateRange)) {
            // Range 模式显示
            const range = value as DateRange;
            if (range.from) {
              display = `${format(range.from, "yyyy-MM-dd")}`;
              if (range.to) {
                display += ` - ${format(range.to, "yyyy-MM-dd")}`;
              }
            }
          } else if (value instanceof Date) {
            // Single 模式显示
            const fmt = showTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd";
            display = format(value, fmt);
          }
        }

        return (
          <FormItem>
            <div
              data-testid={`item-${testId}`}
              className={clsx({
                "w-full flex items-center gap-[10px]": layout === "horizontal",
                "w-full flex flex-col gap-[10px]": layout !== "horizontal",
              })}
            >
              {label && (
                <FormLabel
                  testId={`label-${testId}`}
                  className={cn(
                    FormLabelVariants({ size, variant: finalVariant }),
                    getVariantClassNames(
                      theme,
                      finalVariant,
                      classNames,
                      "label",
                    ),
                  )}
                >
                  {label}
                  {label && required && "*"}
                  {renderLabelRight?.()}
                </FormLabel>
              )}

              <div
                className={clsx({
                  "flex-1": layout === "horizontal",
                })}
              >
                <FormControl asChild>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        data-testid={`date-trigger-${testId}`}
                        className={cn(
                          "w-full justify-between px-4 py-2.5 text-left text-sm font-normal",
                          "bg-gray-50 dark:bg-black/20",
                          "border border-gray-200 dark:border-white/10",
                          "text-gray-900 dark:text-white",
                          "hover:bg-gray-100/60 dark:hover:bg-white/5",
                          "focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:border-primary-500",
                          !value &&
                            "text-gray-400 dark:text-gray-500 placeholder:text-gray-400",
                          error && "border-red-500",
                          classNames?.input,
                        )}
                      >
                        <span className="truncate">{display}</span>
                        <CalendarIcon className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent
                      align="start"
                      // 关键修改：添加 explicit background color 防止透明
                      className="w-auto p-0 border-none bg-transparent shadow-none"
                    >
                      <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-md shadow-xl overflow-hidden">
                        {/* --- 2. 日历组件 --- */}
                        <Calendar
                          // 核心改动：透传 mode，强制类型转换解决 TS 报错
                          mode={mode as any}
                          selected={value}
                          onSelect={(date) => {
                            // react-day-picker 的 onSelect 返回值根据 mode 不同而不同
                            // field.onChange 可以接受 Date 或对象，所以直接传即可
                            field.onChange(date);

                            // 如果是 range 模式，或者开启了时间选择，不要自动关闭
                            // 只有在普通单选模式下才自动关闭
                            if (mode === "single" && !showTime) {
                              setOpen(false);
                            }
                          }}
                          initialFocus
                          // 限制只能选 2 个日期 (针对 Range)
                          defaultMonth={
                            mode === "range"
                              ? (value as DateRange)?.from
                              : (value as Date)
                          }
                          numberOfMonths={mode === "range" ? 2 : 1}
                          className="p-3"
                        />

                        {/* --- 3. 时间选择输入框 (仅支持 Single 模式) --- */}
                        {showTime && mode === "single" && (
                          <div className="p-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-xs font-medium text-gray-500">
                                Time:
                              </span>
                              {/* 使用 Shadcn 的 Input 组件 */}
                              <FormInput
                                type="time"
                                className="h-8 w-full bg-white dark:bg-zinc-950"
                                value={
                                  value && value instanceof Date
                                    ? format(value, "HH:mm")
                                    : ""
                                }
                                onChange={(e) =>
                                  handleTimeChange(
                                    e,
                                    value as Date,
                                    field.onChange,
                                  )
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </FormControl>

                {helpText && (
                  <HelpText
                    testId={`help-text-${testId}`}
                    content={helpText}
                    className={twMerge(
                      FormHelpTextVariants({ size, variant: finalVariant }),
                      getVariantClassNames(
                        theme,
                        finalVariant,
                        classNames,
                        "helpText",
                      ),
                    )}
                  />
                )}

                <AnimatePresence mode="wait" initial={false}>
                  {error && (
                    <FormMessage
                      testId={`message-${testId}`}
                      key={error}
                      error={error}
                      className={twMerge(
                        FormMessageVariants({ variant: finalVariant }),
                        getVariantClassNames(
                          theme,
                          finalVariant,
                          classNames,
                          "message",
                        ),
                      )}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </FormItem>
        );
      }}
    />
  );
}
