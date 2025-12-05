"use client";
import { FormField } from "./FormField";
import { FormItem } from "./FormItem";
import { FormLabel } from "./FormLabel";
import { FormMessage } from "./FormMessage";
import type { FieldValues } from "react-hook-form";
import { FormControl } from "./FormControl";
import React from "react";
import {
  FormHelpTextVariants,
  FormLabelVariants,
  FormMessageVariants,
} from "./constants";
import { HelpText } from "./HelpText";
import { useFormTheme } from "@ui-kit/form/formTheme/FormThemeProvider";
import { twMerge } from "tailwind-merge";
import { getVariantClassNames } from "@ui-kit/form/formTheme";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import type { BaseFieldProps } from "./types/baseFieldType";
import { BaseSelectProps } from "@ui-kit/ui/components/BaseSelect/type";
import { BaseSelect } from "@ui-kit/ui/components";

/**
 * FormSelectFieldProps type combines BaseFieldProps (excluding some input-specific props)
 * with BaseSelectProps to create a comprehensive type for the select field component.
 */
type FormSelectFieldProps<TFieldValues extends FieldValues = FieldValues> =
  Omit<
    BaseFieldProps<TFieldValues>,
    | "type"
    | "inputMode"
    | "autoComplete"
    | "renderLeft"
    | "renderRight"
    | "readOnly"
  > &
    BaseSelectProps;

/**
 * FormSelectField is a fully controlled, theme-aware select dropdown component
 * built for seamless integration with react-hook-form.
 *
 * @component
 * @example
 * ```tsx
 * <FormSelectField
 *   name="country"
 *   label="Country"
 *   placeholder="Select a country"
 *   options={[
 *     {
 *       groupName: 'Popular',
 *       options: [
 *         { label: 'United States', value: 'us' },
 *         { label: 'United Kingdom', value: 'uk' },
 *       ],
 *     }
 *   ]}
 *   required
 * />
 * ```
 */
export function FormSelectField<
  TFieldValues extends FieldValues = FieldValues,
>({
  name,
  label,
  renderLabelRight,
  placeholder,
  disabled,
  required,
  classNames = {},
  testId,
  size = "md",
  helpText,
  variant = "default",
  layout = "vertical",
  options,
  onOpenChange,
  onChange,
  ...props
}: Readonly<FormSelectFieldProps<TFieldValues>>) {
  const theme = useFormTheme();
  return (
    <FormField<TFieldValues, typeof name>
      name={name}
      renderAction={({ field, error }) => {
        const finalvariant = error ? "error" : variant;
        return (
          <FormItem>
            <div
              className={clsx({
                "flex items-center gap-[10rem]": layout === "horizontal",
                "flex flex-col gap-[5rem]": layout !== "horizontal",
              })}
            >
              {label && (
                <FormLabel
                  className={twMerge(
                    FormLabelVariants({ size, variant: finalvariant }),
                    getVariantClassNames(
                      theme,
                      finalvariant,
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
                <FormControl asChild={true}>
                  <BaseSelect
                    testId={testId}
                    onOpenChange={onOpenChange}
                    onChange={(value) => {
                      field.onChange(value);
                      onChange?.(value);
                    }}
                    options={options}
                    placeholder={placeholder}
                    value={field.value}
                    disabled={disabled}
                    variant={finalvariant}
                    size={size}
                    {...props}
                  />
                </FormControl>
                {/* Show help text if provided */}
                {helpText && (
                  <HelpText
                    content={helpText}
                    className={twMerge(
                      FormHelpTextVariants({ size, variant: finalvariant }),
                      getVariantClassNames(
                        theme,
                        finalvariant,
                        classNames,
                        "helpText",
                      ),
                    )}
                  />
                )}
                {/* Show error message if present */}
                <AnimatePresence mode="wait" initial={false}>
                  {error && (
                    <FormMessage
                      key={error}
                      error={error}
                      className={twMerge(
                        FormMessageVariants({ variant: finalvariant }),
                        getVariantClassNames(
                          theme,
                          finalvariant,
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
    ></FormField>
  );
}
