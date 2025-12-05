import React, { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { isNullOrEmpty } from "@utils";
import { cva } from "class-variance-authority";
import { motion } from "framer-motion";

/**
 * cva is a utility for creating class variants in Tailwind CSS.
 * wraps the class names with conditional variants.
 */
const wrapperVariants = cva(
  "w-full h-[40rem] flex justify-between items-center relative transition ",
  {
    variants: {
      variant: {
        splitBoxed: "gap-[10rem]",
        softBoxed:
          "rounded-[18rem] border border-gray-300 transition overflow-hidden [&>*:nth-child(2)]:border-l-1 [&>*:nth-child(2)]:border-r-1 [&>*:nth-child(2)]:border-gray-300",
      },
    },
  },
);

const buttonVariants = cva(
  "w-[40rem] h-[40rem] text-[16rem] flex items-center justify-center disabled:opacity-50 transition hover:bg-gray-50 relative",
  {
    variants: {
      variant: {
        splitBoxed:
          "border border-gray-300 bg-white hover:bg-gray-50 rounded-[4rem] w-[40rem] h-[40rem]",
        softBoxed: "w-[40rem] h-full border-0",
      },
    },
  },
);

const inputContainerVariants = cva(
  "flex items-center justify-center w-full h-[40rem] outline-none ring-0 ",
  {
    variants: {
      variant: {
        splitBoxed: "border border-gray-300 bg-white rounded-[4rem] pr-[10rem]",
        softBoxed: "bg-transparent",
      },
    },
    defaultVariants: {
      variant: "splitBoxed",
    },
  },
);

/**
 * unitVariants defines the styles for the unit label next to the input.
 */
const unitVariants = cva(
  "h-full ml-[10rem] text-[14rem] text-gray-400 pr-[10rem]",
  {
    variants: {
      variant: {
        splitBoxed: "text-gray-500 items-center flex justify-center",
        softBoxed: "pr-[10rem]",
      },
    },
    defaultVariants: {
      variant: "splitBoxed",
    },
  },
);

/**
 * inputVariants defines the styles for the input field itself.
 * It includes styles for numeric input and removes default spin buttons.
 */

const inputVariants = cva(
  "w-full h-full px-[10rem] text-center text-[12rem] outline-none border-none bg-transparent appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
  {
    variants: {
      variant: {
        splitBoxed: "text-gray-700 focus:ring-0 focus:border-gray-300",
        softBoxed: "",
      },
    },
    defaultVariants: {
      variant: "splitBoxed",
    },
  },
);

/**
 * FormStepperInputProps defines the properties for the FormStepperInput component.
 */
type FormStepperInputProps = {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  className?: string;
  inoutContainerClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  unitClassName?: string;
  noPressAnimation?: boolean;
  variant?: "softBoxed" | "splitBoxed";
  renderSuffix?: () => React.ReactNode;
  renderPrefix?: () => React.ReactNode;
};

/**
 * FormStepperInput is a customizable numeric input component with increment/decrement buttons.
 *
 * @component
 *
 * @example
 * ```tsx
 * const [value, setValue] = useState(1);
 *
 * <FormStepperInput
 *   value={value}
 *   onChange={setValue}
 *   min={0}
 *   max={100}
 *   unit="$"
 *   renderPrefix={() => <Minus />}
 *   renderSuffix={() => <Plus />}
 * />
 * ```
 *
 * @param {Object} props - Component props
 * @param {number} props.value - Current numeric value
 * @param {(value: number) => void} props.onChange - Callback function when value changes
 * @param {number} [props.min] - Minimum allowed value
 * @param {number} [props.max] - Maximum allowed value
 * @param {number} [props.step=1] - Step value for increment/decrement
 * @param {string} [props.unit] - Unit label to display after the value
 * @param {() => React.ReactNode} [props.renderPrefix] - Function to render the prefix button content
 * @param {() => React.ReactNode} [props.renderSuffix] - Function to render the suffix button content
 * @param {boolean} [props.disabled] - Whether the input is disabled
 * @param {'softBoxed'} [props.variant='softBoxed'] - Visual variant of the input
 *
 * @returns {React.ReactElement} A numeric input component with increment/decrement buttons
 */
// FormStepperInput is a controlled component that allows users to increment or decrement a numeric value.
export const FormStepperInput = ({
  value,
  onChange,
  min = 1,
  max = 999,
  step = 1,
  unit,
  disabled,
  className,
  variant = "splitBoxed",
  inoutContainerClassName,
  inputClassName,
  buttonClassName,
  unitClassName,
  noPressAnimation = true,
  renderSuffix = () => "+",
  renderPrefix = () => "-",
}: FormStepperInputProps): React.ReactElement => {
  const [inputValue, setInputValue] = useState(value.toString());

  // Sync the input value with the initial value prop
  useEffect(() => {
    if (inputValue && value.toString() !== inputValue) {
      setInputValue(value.toString());
    }
  }, [value, inputValue]);

  // Clamp the value to ensure it stays within the min and max range
  const clamp = (val: number) => Math.max(min, Math.min(val, max));

  // Update the value and input state when incrementing or decrementing
  const update = (val: number) => {
    const fixed = clamp(val);
    onChange(fixed);
    setInputValue(fixed.toString());
  };

  // Handle input change, allowing only numeric values
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    // If the input is empty, we set it to an empty string
    setInputValue(raw);

    // Parse the input value to an integer
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = clamp(parsed);
      setInputValue(clamped.toString());
      onChange(clamped);
    }
  };

  // Handle blur event to ensure the input value is within the min range
  const handleBlur = () => {
    // If the input value is empty, set it to the minimum value
    if (isNullOrEmpty(inputValue)) {
      setInputValue(min.toString());
      onChange(min);
    }
  };

  return (
    <div
      className={twMerge(
        wrapperVariants({ variant }),
        // 允许自定义类名覆盖基础样式，但保持分隔线逻辑
        className?.includes("border")
          ? className
          : twMerge(wrapperVariants({ variant }), className),
      )}
    >
      <motion.button
        whileTap={!noPressAnimation ? { scale: 0.9 } : {}}
        whileHover={!noPressAnimation ? { y: -1 } : {}}
        transition={{ type: "spring", stiffness: 300 }}
        data-testid="form-stepper-input-decrement"
        type="button"
        className={twMerge(buttonVariants({ variant }), buttonClassName)}
        onClick={() => update(value - step)}
        disabled={disabled || value <= min}
      >
        {renderPrefix()}
      </motion.button>

      <div
        className={twMerge(
          inputContainerVariants({ variant }),
          disabled ? "opacity-50" : "",
          inoutContainerClassName,
        )}
      >
        <input
          data-testid="form-stepper-input"
          type="number"
          inputMode="numeric"
          pattern="\d*"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (["-", ".", "e"].includes(e.key)) {
              e.preventDefault();
            }
          }}
          onWheel={(e) => {
            e.currentTarget.blur();
            e.preventDefault();
          }}
          className={twMerge(
            inputVariants({ variant }),
            "hover:cursor-default",
            inputClassName,
          )}
          disabled={disabled}
          style={{ WebkitAppearance: "textfield", MozAppearance: "textfield" }}
        />
        {unit && (
          <span className={twMerge(unitVariants({ variant }), unitClassName)}>
            {unit}
          </span>
        )}
      </div>

      <motion.button
        whileTap={!noPressAnimation ? { scale: 0.9 } : {}}
        whileHover={!noPressAnimation ? { y: -1 } : {}}
        transition={{ type: "spring", stiffness: 300 }}
        data-testid="form-stepper-input-increment"
        type="button"
        className={twMerge(buttonVariants({ variant }), buttonClassName)}
        onClick={() => update(value + step)}
        disabled={disabled || value >= max}
      >
        {renderSuffix()}
      </motion.button>
    </div>
  );
};
