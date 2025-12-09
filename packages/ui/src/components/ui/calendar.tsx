import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker } from "react-day-picker";

import { cn } from "../../../lib/utils";
import { Button, buttonVariants } from "./button";

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn(
        // 整个日历卡片：白底 + 阴影 + 圆角
        "group/calendar rounded-2xl border border-black/5 bg-white text-gray-900",
        "p-3 shadow-xl",
        className,
      )}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        // 外层容器
        root: cn("w-fit text-gray-900", classNames?.root),

        // 月份容器
        months: "flex flex-col gap-4",
        month: "flex w-full flex-col gap-4",

        // 顶部导航（左右箭头）
        nav: " inset-x-0 top-0 flex w-full items-center justify-between gap-1",

        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 select-none rounded-full p-0 aria-disabled:opacity-40",
          "bg-white hover:bg-gray-100 border border-gray-200",
          classNames?.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 select-none rounded-full p-0 aria-disabled:opacity-40",
          "bg-white hover:bg-gray-100 border border-gray-200",
          classNames?.button_next,
        ),

        // 月份标题
        month_caption:
          "flex h-8 w-full items-center justify-center px-8 text-sm font-medium",

        // 下拉（切换年月）
        dropdowns:
          "flex h-8 w-full items-center justify-center gap-1.5 text-sm font-medium",
        dropdown_root:
          "relative rounded-md border border-gray-200 bg-white has-focus:ring-primary-500/50 has-focus:ring-[3px]",
        dropdown: "absolute inset-0 opacity-0",

        caption_label:
          "select-none text-sm font-medium text-gray-900 flex items-center gap-1",

        // 星期标题
        table: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "flex-1 select-none rounded-md text-[0.75rem] font-normal text-gray-500",

        // 日期行
        week: "mt-2 flex w-full",

        week_number_header: "w-8 select-none",
        week_number: "select-none text-[0.75rem] text-gray-400",

        // 每个单元格的 <td> 容器
        day: "group/day relative w-8 h-8 p-0 text-center",

        // 区间样式（预留，将具体视觉交给 DayButton）
        range_start: "rounded-l-md",
        range_middle: "rounded-none",
        range_end: "rounded-r-md",

        // 今天
        today:
          "rounded-md border border-primary-200 bg-primary-50 text-primary-700 data-[selected=true]:rounded-md",

        // 灰掉的 / 不可用
        outside: "text-gray-300 aria-selected:text-gray-300",
        disabled: "text-gray-300 opacity-50",

        hidden: "invisible",

        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...props}
          />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }
          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => (
          <td {...props}>
            <div className="flex h-8 w-8 items-center justify-center text-center text-xs text-gray-400">
              {children}
            </div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        // 默认：白底 + 深色文字
        "flex h-8 w-8 items-center justify-center rounded-md text-xs font-normal",
        "text-gray-900 hover:bg-gray-100",

        // 单选选中
        "data-[selected-single=true]:bg-primary-500 data-[selected-single=true]:text-white",

        // 区间
        "data-[range-middle=true]:bg-primary-100 data-[range-middle=true]:text-primary-700",
        "data-[range-start=true]:bg-primary-500 data-[range-start=true]:text-white",
        "data-[range-end=true]:bg-primary-500 data-[range-end=true]:text-white",

        // 聚焦高亮
        "group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-primary-500/60",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10",

        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
