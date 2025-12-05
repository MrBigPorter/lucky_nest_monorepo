"use client";
import { FormField } from "./FormField";
import { FormItem } from "./FormItem";
import { FormLabel } from "./FormLabel";
import { FormInput } from "./FormInput";
import { FormMessage } from "./FormMessage";
import type { FieldValues } from "react-hook-form";
import { FormControl } from "./FormControl";
import { FormControlContainer } from "./FormControlContainer";
import React from "react";
import {
  formContainerVariants,
  FormHelpTextVariants,
  formInputVariants,
  FormLabelVariants,
  FormMessageVariants,
} from "./constants";
import { getFieldDefaults } from "./getFieldDefaults";
import { HelpText } from "./HelpText";
import { useFormTheme } from "@ui-kit/form/formTheme/FormThemeProvider";
import { getVariantClassNames } from "@ui-kit/form/formTheme";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import type { BaseFieldProps } from "./types/baseFieldType";
import { cn } from "@utils";

/**
 * `FormTextField` is a reusable form component that wraps
 * a complete field unit: label, input, error message.
 *
 * It connects to React Hook Form via `FormField`,
 * and integrates with your custom `FormItem` system.
 *
 * - Automatically shows error messages via `FormMessage`
 * - Handles label rendering + required indicator
 * - Designed to be used inside `FormProvider` context
 *
 * @example
 * <FormTextField
 *   name="email"
 *   label="Email"
 *   placeholder="Enter your email"
 *   required
 * />
 */
export function FormTextField<TFieldValues extends FieldValues = FieldValues>({
  name,
  type,
  label,
  renderLabelRight,
  placeholder,
  disabled,
  readOnly,
  required,
  classNames = {},
  renderLeft,
  renderRight,
  inputMode,
  autoComplete,
  data,
  testId,
  size = "md",
  helpText,
  variant = "default",
  layout = "vertical",
}: Readonly<BaseFieldProps<TFieldValues>>) {
  const defaultHints = getFieldDefaults(name as string);
  const theme = useFormTheme();
  return (
    <FormField<TFieldValues, typeof name>
      name={name}
      renderAction={({ field, error }) => {
        const finalvariant = error ? "error" : variant;
        return (
          <FormItem>
            <div
              data-testid={`item-${testId}`}
              className={clsx({
                "w-full flex items-center gap-[10rem]": layout === "horizontal",
                "w-full flex flex-col gap-[10rem]": layout !== "horizontal",
              })}
            >
              {label && (
                <FormLabel
                  testId={`label-${testId}`}
                  className={cn(
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
                  <FormControlContainer
                    testId={`container-${testId}`}
                    className={cn(
                      formContainerVariants({
                        size,
                        variant: finalvariant,
                        disabled,
                      }),
                      getVariantClassNames(
                        theme,
                        finalvariant,
                        classNames,
                        "container",
                      ),
                    )}
                    renderLeft={renderLeft?.()}
                    renderRight={renderRight?.()}
                  >
                    <FormInput
                      {...field}
                      className={cn(
                        formInputVariants({ size, variant: finalvariant }),
                        getVariantClassNames(
                          theme,
                          finalvariant,
                          classNames,
                          "input",
                        ),
                      )}
                      data-testid={`input-${testId}`}
                      placeholder={placeholder}
                      type={type ?? "text"}
                      readOnly={readOnly}
                      disabled={disabled}
                      inputMode={inputMode ?? defaultHints.inputMode}
                      autoComplete={autoComplete ?? defaultHints.autoComplete}
                      onChange={(e) => {
                        field.onChange(e);
                        data?.onChange?.(e);
                      }}
                      onBlur={(e) => {
                        field.onBlur();
                        data?.onBlur?.(e);
                      }}
                      onFocus={(e) => {
                        data?.onFocus?.(e);
                      }}
                      onKeyDown={(e) => {
                        data?.onKeyDown?.(e);
                      }}
                    />
                  </FormControlContainer>
                </FormControl>
                {/* Show help text if provided */}
                {helpText && (
                  <HelpText
                    testId={`help-text-${testId}`}
                    content={helpText}
                    className={cn(
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
                      testId={`message-${testId}`}
                      key={error}
                      error={error}
                      className={cn(
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
