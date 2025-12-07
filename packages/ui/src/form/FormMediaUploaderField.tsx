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
} from "./index.ts";
import type { FieldValues } from "react-hook-form";
import React, { ReactNode } from "react";
import { useFormTheme } from "./formTheme/FormThemeProvider";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import type { BaseFieldProps } from "./types/baseFieldType.ts";
import * as MediaUploader from "../components/MediaUploader";
import { getVariantClassNames } from "./formTheme";

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
  accept?: string;
  showRemoveButton?: boolean;
  previewClassName?: string;
  labelClassName?: string;
  buttonClassName?: string;
  helpTextClassName?: string;
  renderItem?: ({
    file,
    handleRemoveFile,
    index,
    showRemoveButton,
  }: MediaUploader.RenderItemProps) => React.ReactNode;
  renderButton?: (openFilePicker: (() => void) | undefined) => ReactNode;
};

/**
 * FormMediaUploaderField is a reusable form component that wraps MediaUploader components to provide
 * a complete solution for uploading and previewing media files (images and videos) within forms.
 *
 * This component integrates with react-hook-form for form state management and validation.
 * It supports customization of appearance through various className props and custom rendering functions.
 *
 * Features:
 * - File upload through a file picker dialog
 * - Preview of uploaded media files (images and videos)
 * - Removal of uploaded files
 * - Integration with form validation
 * - Customizable styling and layout
 * - Custom rendering of preview items and upload button
 *
 * @example
 * ```tsx
 * <Form {...form}>
 *   <FormMediaUploaderField
 *     name="files"
 *     label="Upload Media"
 *     helpText="Upload images or videos (max 5 files, 2MB each)"
 *     required={true}
 *   />
 * </Form>
 * ```
 *
 * @param name - The name of the field, used to register with react-hook-form
 * @param label - The label for the field, displayed above the input
 * @param renderLabelRight - Optional function to render additional content to the right of the label
 * @param required - Whether the field is required, adds an asterisk to the label
 * @param testId - Optional test ID for testing purposes, useful for e2e tests
 * @param size - Size of the field, can be 'sm', 'md', 'lg', etc. Defaults to 'md'
 * @param helpText - Optional help text displayed below the input, providing additional context or instructions
 * @param variant - Variant of the field, can be 'default', 'error', 'success', etc. Controls styling
 * @param layout - Layout of the field, can be 'vertical' or 'horizontal'. 'vertical' stacks label and input, 'horizontal' aligns them side by side
 * @param showRemoveButton - Whether to show the remove button for uploaded files, defaults to true
 * @param renderItem - Optional function to render each uploaded item, receives file, handleRemoveFile, index, and showRemoveButton
 * @param renderButton - Optional function to render a custom button for opening the file picker, receives openFilePicker function
 * @param classNames - Optional class names for customizing styles, can be used to override default styles
 * @param labelClassName - Optional class name for the label, allows custom styling
 * @param buttonClassName - Optional class name for the button, allows custom styling
 * @param previewClassName - Optional class name for the preview area, allows custom styling
 * @param helpTextClassName - Optional class name for the help text, allows custom styling
 * @param accept - MIME types to accept for file upload, defaults to 'image/*,video/*'
 */
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
  accept = "image/*,video/*", // Default accept types for media files
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
                "flex  gap-[10px]": layout === "horizontal",
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
                <FormControl asChild={true}>
                  <MediaUploader.Root accept={accept} onUpload={field.onChange}>
                    <MediaUploader.Preview
                      testId={testId}
                      className={previewClassName}
                      showRemoveButton={showRemoveButton}
                      renderItem={renderItem}
                      renderButton={(openFilePicker) =>
                        renderButton ? (
                          renderButton(openFilePicker)
                        ) : (
                          <MediaUploader.Button
                            testId={testId}
                            className={buttonClassName}
                          />
                        )
                      }
                    />
                  </MediaUploader.Root>
                </FormControl>
                {/* Show help text if provided */}
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
                {/* Show error message if present */}
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
    ></FormField>
  );
}
