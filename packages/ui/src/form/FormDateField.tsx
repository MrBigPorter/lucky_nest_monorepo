import * as React from "react";
import type { FieldValues } from "react-hook-form";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon } from "lucide-react";

import {
  FormControl,
  FormField,
  FormHelpTextVariants,
  FormItem,
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
import { cn } from "../../lib/utils";

import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Button } from "../components/ui/button";

type FormDateFieldProps<TFieldValues extends FieldValues = FieldValues> = Omit<
  BaseFieldProps<TFieldValues>,
  "type" | "inputMode" | "autoComplete" | "renderLeft" | "renderRight" | "data"
> & {
  placeholder?: string;
  /** 自定义显示格式 */
  formatValue?: (date: Date | undefined) => string;
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
  formatValue,
  disabled,
}: Readonly<FormDateFieldProps<TFieldValues>>) {
  const theme = useFormTheme();
  const [open, setOpen] = React.useState(false);

  return (
    <FormField<TFieldValues, typeof name>
      name={name}
      renderAction={({ field, error }) => {
        const finalVariant = error ? "error" : variant;
        const value = field.value as Date | undefined;
        const display =
          (value &&
            (formatValue ? formatValue(value) : value.toLocaleDateString())) ||
          placeholder;

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
                          "w-full justify-between px-4 py-2.5 bg-gray-50 dark:bg-black/20 border rounded-lg text-left font-normal text-sm text-gray-900 dark:text-white hover:bg-gray-100/40 dark:hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:border-primary-500",
                          value
                            ? "border-gray-200 dark:border-white/10"
                            : "border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500",
                          error && "border-red-500",
                          classNames?.input,
                        )}
                      >
                        <span className="truncate">{display}</span>
                        <CalendarIcon className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-auto p-0 bg-popover"
                    >
                      <Calendar
                        mode="single"
                        selected={value}
                        onSelect={(date) => {
                          field.onChange(date ?? null);
                          setOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>

                {/* helpText */}
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

                {/* error message */}
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
