
import { FormField } from "./FormField.tsx";
import { FormItem } from "./FormItem.tsx";
import { FormLabel } from "./FormLabel.tsx";
import { FormInput } from "./FormInput.tsx";
import { FormMessage } from "./FormMessage.tsx";
import type { FieldValues } from "react-hook-form";
import { FormControl } from "./FormControl.tsx";
import { FormControlContainer } from "./FormControlContainer.tsx";
import React, { useState } from "react";
import {
  formContainerVariants,
  FormHelpTextVariants,
  formInputVariants,
  FormLabelVariants,
  FormMessageVariants,
} from "./constants.ts";
import { getFieldDefaults } from "./getFieldDefaults.ts";
import { HelpText } from "./HelpText.tsx";
import { useFormTheme } from "@ui-kit/form/formTheme/FormThemeProvider";
import { twMerge } from "tailwind-merge";
import { getVariantClassNames } from "@ui-kit/form/formTheme";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { BaseFieldProps } from "@ui-kit/form/types/baseFieldType";

/**
 * `FormTextField` is a reusable form component that wraps
 * a complete field unit: label, input, error message.
 *
 * It connects to React Hook Form via `FormField`,
 * and integrates with your custom `FormItem` system.
 *
 * - Automatically shows error messages via `FormMessage`
 * - Handles label rendering and required indicator
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
export function FormPasswordField<
  TFieldValues extends FieldValues = FieldValues,
>({
  name,
  label,
  renderLabelRight,
  placeholder,
  disabled,
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
  const [showPassword, setShowPassword] = useState(false);
  return (
    <FormField<TFieldValues, typeof name>
      name={name}
      renderAction={({ field, error }) => {
        const displayVariant = error ? "error" : variant;
        const rightContent = (() => {
          if (renderRight) {
            return renderRight(showPassword);
          }
          const Icon = showPassword ? EyeOff : Eye;
          const iconTestId = showPassword ? "icon-eye-off" : "icon-eye";
          const iconClass = showPassword ? "lucide-eye-off" : "lucide-eye";
          return (
            <Icon data-testid={iconTestId} className={iconClass} aria-hidden />
          );
        })();
        return (
          <FormItem>
            <div
              className={clsx({
                "flex items-center gap-4": layout === "horizontal",
                "flex flex-col gap-1": layout !== "horizontal",
              })}
            >
              {label && (
                <FormLabel
                  className={twMerge(
                    FormLabelVariants({ size, variant: displayVariant }),
                    getVariantClassNames(
                      theme,
                      displayVariant,
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
                    className={twMerge(
                      formContainerVariants({
                        size,
                        variant: displayVariant,
                        disabled,
                      }),
                      getVariantClassNames(
                        theme,
                        displayVariant,
                        classNames,
                        "container",
                      ),
                    )}
                    renderLeft={renderLeft?.()}
                    renderRight={
                      <button
                        data-testid={`right-button-${testId}`}
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {rightContent}
                      </button>
                    }
                  >
                    <FormInput
                      {...field}
                      className={twMerge(
                        formInputVariants({ size, variant: displayVariant }),
                        getVariantClassNames(
                          theme,
                          displayVariant,
                          classNames,
                          "input",
                        ),
                      )}
                      data-testid={testId}
                      placeholder={placeholder}
                      type={showPassword ? "text" : "password"}
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
                    content={helpText}
                    className={twMerge(
                      FormHelpTextVariants({ size, variant: displayVariant }),
                      getVariantClassNames(
                        theme,
                        displayVariant,
                        classNames,
                        "helpText",
                      ),
                    )}
                  />
                )}
                {/* Show an error message if present */}
                <AnimatePresence mode="wait" initial={false}>
                  {error && (
                    <FormMessage
                      key={error}
                      error={error}
                      className={twMerge(
                        FormMessageVariants({ variant: displayVariant }),
                        getVariantClassNames(
                          theme,
                          displayVariant,
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
