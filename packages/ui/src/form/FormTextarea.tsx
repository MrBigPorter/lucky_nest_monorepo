import React from "react";
import { useFormItemContext } from "./FormItem";
import { twMerge } from "tailwind-merge";
import type { AutoCompleteOption, InputModeOption } from "./constants";

export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "autoComplete" | "inputMode"
  > & {
    inputMode?: InputModeOption;
    autoComplete?: AutoCompleteOption;
    className?: string;
    testId?: string;
  }
>(({ inputMode, autoComplete, className, testId, ...props }, ref) => {
  const { id } = useFormItemContext();
  const errorId = `${id}-message`;

  return (
    <textarea
      id={id}
      data-testid={testId}
      aria-describedby={errorId}
      aria-invalid={!!props["aria-invalid"] || undefined}
      ref={ref}
      autoComplete={autoComplete}
      inputMode={inputMode}
      // 防止受控 undefined 报错
      value={props.value ?? ""}
      className={twMerge(
        // 样式来源：你原来的 Textarea 组件
        "w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border rounded-lg " +
          "outline-none transition-all min-h-[100px] resize-none " +
          "dark:text-white placeholder-gray-400 dark:placeholder-gray-600",
        className,
      )}
      {...props}
    />
  );
});

FormTextarea.displayName = "FormTextarea";
