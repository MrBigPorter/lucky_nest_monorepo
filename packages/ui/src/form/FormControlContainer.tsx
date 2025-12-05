import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

/***
 * Props for the FormControlContainer component.
 * @property renderLeft - Optional React node to render on the left side of the container.
 * @property renderRight - Optional React node to render on the right side of the container.
 * @property children - The main content of the form control, typically an input or select element.
 * @property error - Optional boolean to indicate if there is an error state.
 * @property disabled - Optional boolean to indicate if the form control is disabled.
 * @property className - Additional CSS classes to apply to the container.
 */
interface Props {
  renderLeft?: React.ReactNode;
  renderRight?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  testId?: string;
}
/*****
 * FormControlContainer is a layout component that wraps form controls with optional left and right render props.
 * It is designed to be flexible and can be used to create complex form layouts.
 *
 * @param renderLeft - Optional React node to render on the left side of the container.
 * @param renderRight - Optional React node to render on the right side of the container.
 * @param children - The main content of the form control, typically an input or select element.
 * @param className - Additional CSS classes to apply to the container.
 * @param disabled - Optional boolean to indicate if the form control is disabled.
 * @param testId - Optional test ID for testing purposes.
 */

export const FormControlContainer = ({
  renderLeft,
  renderRight,
  children,
  className = "",
  disabled,
  testId,
}: Props) => {
  const [isFocused, setIsFocused] = React.useState(false);
  return (
    <motion.div
      data-testid={testId}
      className={cn(
        "w-full h-[40rem] flex items-center border rounded-md px-[10rem]  transition-colors duration-200",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      animate={{
        scale: isFocused ? 1.02 : 1,
        boxShadow: isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
      }}
      transition={{ duration: 0.15 }}
    >
      {renderLeft}
      <div className="flex-1 h-full">{children}</div>
      {renderRight}
    </motion.div>
  );
};
