import * as React from "react";
import type { FieldValues } from "react-hook-form";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";

import { Checkbox } from "../components/ui/checkbox";
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

type FormCheckboxFieldProps<TFieldValues extends FieldValues = FieldValues> =
  Omit<
    BaseFieldProps<TFieldValues>,
    "type" | "inputMode" | "autoComplete" | "renderLeft" | "renderRight"
  > & {
    /** 说明文案（在勾选框右边、label 下方的小字） */
    description?: string;
  };

export function FormCheckboxField<
  TFieldValues extends FieldValues = FieldValues,
>({
  name,
  label,
  renderLabelRight,
  required,
  classNames = {},
  testId,
  size = "md",
  helpText,
  variant = "default",
  layout = "horizontal",
  description,
  disabled,
}: Readonly<FormCheckboxFieldProps<TFieldValues>>) {
  const theme = useFormTheme();

  return (
    <FormField<TFieldValues, typeof name>
      name={name}
      renderAction={({ field, error }) => {
        const finalVariant = error ? "error" : variant;

        return (
          <FormItem>
            <div
              data-testid={`item-${testId}`}
              className={clsx({
                "w-full flex items-start gap-[10px]": true,
              })}
            >
              {/* 复选框 + 文本一行 */}
              <FormControl asChild>
                <div className="flex items-start gap-3">
                  <Checkbox
                    data-testid={`checkbox-${testId}`}
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />

                  <div className="flex-1 space-y-1">
                    {label && (
                      <FormLabel
                        testId={`label-${testId}`}
                        className={cn(
                          "mb-0 cursor-pointer",
                          FormLabelVariants({
                            size,
                            variant: finalVariant,
                          }),
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

                    {description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </FormControl>
            </div>

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
          </FormItem>
        );
      }}
    />
  );
}
