import * as LabelPrimitive from "@radix-ui/react-label";
import React from "react";
import { useFormItemContext } from "./FormItem.tsx";
import { twMerge } from "tailwind-merge";

/**
 * FormLabel is a wrapper around Radix UI Label
 * that auto-binds to FormItem context id.
 *
 * Must be used within <FormItem>
 */
export const FormLabel = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    testId?: string;
  }
>(({ className = "", children, testId, ...props }, ref) => {
  const { id } = useFormItemContext();
  return (
    <LabelPrimitive.Root
      data-testid={testId}
      ref={ref}
      htmlFor={id}
      className={twMerge(
        "text-[14px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex ",
        className,
      )}
      {...props}
    >
      {children}
    </LabelPrimitive.Root>
  );
});

FormLabel.displayName = "FormLabel";
