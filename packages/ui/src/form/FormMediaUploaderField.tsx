import React, { ReactNode } from "react";
import type { FieldValues } from "react-hook-form";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";

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
import * as MediaUploader from "../components/MediaUploader";

type FormMediaUploaderFieldProps<
  TFieldValues extends FieldValues = FieldValues,
> = Omit<
  BaseFieldProps<TFieldValues>,
  | "placeholder"
  | "type"
  | "inputMode"
  | "autoComplete"
  | "renderLeft"
  | "renderRight"
> & {
  maxFileCount?: number;
  accept?: string;
  showRemoveButton?: boolean;
  previewClassName?: string;
  labelClassName?: string;
  buttonClassName?: string;
  helpTextClassName?: string;
  renderItem?: (props: MediaUploader.RenderItemProps) => React.ReactNode;
  renderButton?: (openFilePicker?: () => void) => ReactNode;
};

export function FormMediaUploaderField<
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
  layout = "vertical",
  showRemoveButton = true,
  renderItem,
  renderButton,
  labelClassName,
  buttonClassName,
  previewClassName,
  helpTextClassName,
  accept = "image/*,video/*",
  maxFileCount,
}: Readonly<FormMediaUploaderFieldProps<TFieldValues>>) {
  const theme = useFormTheme();

  return (
    <FormField<TFieldValues, typeof name>
      name={name}
      renderAction={({ field, error }) => {
        const finalVariant = error ? "error" : variant;

        return (
          <FormItem>
            <div
              className={clsx({
                "flex gap-[10px]": layout === "horizontal",
                "flex flex-col gap-[10px]": layout !== "horizontal",
              })}
            >
              {label && (
                <FormLabel
                  className={twMerge(
                    FormLabelVariants({ size, variant: finalVariant }),
                    getVariantClassNames(
                      theme,
                      finalVariant,
                      classNames,
                      "label",
                    ),
                    labelClassName,
                  )}
                >
                  {label}
                  {label && required && "*"}
                  {renderLabelRight?.()}
                </FormLabel>
              )}

              <div
                data-testid={`${testId}-media-uploader-field`}
                className={clsx({
                  "flex-1": layout === "horizontal",
                })}
              >
                <FormControl asChild>
                  <MediaUploader.Root
                    maxFileCount={maxFileCount}
                    accept={{
                      ...(accept ? { "image/*": [], "video/*": [] } : {}),
                    }}
                    onUpload={field.onChange}
                  >
                    <MediaUploader.Preview
                      className={previewClassName}
                      showRemoveButton={showRemoveButton}
                      renderItem={renderItem}
                      renderButton={(openFilePicker) =>
                        renderButton ? (
                          renderButton(openFilePicker)
                        ) : (
                          <MediaUploader.Button className={buttonClassName} />
                        )
                      }
                    />
                  </MediaUploader.Root>
                </FormControl>

                {/* helpText */}
                {helpText && (
                  <HelpText
                    content={helpText}
                    className={twMerge(
                      FormHelpTextVariants({ size, variant: finalVariant }),
                      getVariantClassNames(
                        theme,
                        finalVariant,
                        classNames,
                        "helpText",
                      ),
                      helpTextClassName,
                    )}
                  />
                )}

                {/* error message */}
                <AnimatePresence mode="wait" initial={false}>
                  {error && (
                    <FormMessage
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
