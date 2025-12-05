
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/select";
import type { BaseSelectProps } from "@/components/BaseSelect/type";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";
import { ChevronDownIcon } from "lucide-react";

const selectTriggerVariants = cva(
  "w-full bg-white pl-[10px] border-gray-300 rounded-[8px] focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-0",
  {
    variants: {
      variant: {
        default: "border-gray-300",
        error:
          "border-red-500 bg-red-50 focus:ring-red-400 focus:border-red-500",
        success:
          "border-green-500 bg-green-50 focus:ring-green-400 focus:border-green-500",
        warning:
          "border-yellow-500 bg-yellow-50 focus:ring-yellow-400 focus:border-yellow-500",
      },
      size: {
        sm: "!h-[30px] text-[14px]",
        md: "!h-[40px] text-[16px]",
        lg: "!h-[50px] text-[18px] py-[2px] px-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

const selectContentVariants = cva(
  "max-h-[300px] min-w-[8px] pl-[10px] overflow-y-auto bg-white shadow-lg rounded-md border border-gray-300 focus:outline-none focus:ring-0 focus:ring-blue-500",
  {
    variants: {
      variant: {
        default: "bg-white",
        error: "bg-red-50",
        success: "bg-green-50",
        warning: "bg-yellow-50",
      },
      size: {
        sm: "text-[14px]",
        md: "text-[16px]",
        lg: "text-[18px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

const selectItemVariants = cva(
  "relative flex cursor-default select-none items-center rounded-[8px] py-[1.5px] pl-[10px] pr-[8px] outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  {
    variants: {
      variant: {
        default: "text-gray-900 hover:bg-gray-100 focus:bg-gray-200",
        error: "text-red-700 hover:bg-red-100 focus:bg-red-200",
        success: "text-green-700 hover:bg-green-100 focus:bg-green-200",
        warning: "text-yellow-700 hover:bg-yellow-100 focus:bg-yellow-200",
      },
      size: {
        sm: "text-[14px]",
        md: "text-[16px]",
        lg: "text-[18px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

const selectLabelVariants = cva("px-2 py-1.5 text-sm font-medium", {
  variants: {
    variant: {
      default: "text-gray-700",
      error: "text-red-700",
      success: "text-green-700",
      warning: "text-yellow-700",
    },
    size: {
      sm: "text-[14px]",
      md: "text-[16px]",
      lg: "text-[18px]",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

/**
 * BaseSelect component
 * A customizable select component with support for grouped options, icons, and various styles.
 * @param {BaseSelectProps} props - The properties for the BaseSelect component.
 * @param {string} [props.value] - The currently selected value.
 * @param {GroupSelectOptionProps[]} props.options - The options for the select, grouped by category.
 * @param {(value: string) => void} [props.onChange] - Callback function when the selected value changes.
 * @param {(open: boolean) => void} [props.onOpenChange] - Callback function when the select opens or closes.
 * @param {string} [props.placeholder] - Placeholder text when no option is selected.
 * @param {boolean} [props.disabled] - Whether the select is disabled.
 * @param {'default' | 'error' | 'success' | 'warning'} [props.variant] - The variant style of the select.
 * @param {'sm' | 'md' | 'lg'} [props.size] - The size of the select.
 * @param {string} [props.triggerClassName] - Additional class names for the select trigger.
 * @param {string} [props.contentClassName] - Additional class names for the select content.
 * @param {string} [props.itemClassName] - Additional class names for the select items.
 * @param {string} [props.separatorClassName] - Additional class names for the select separator.
 * @param {boolean} [props.showSeparator] - Whether to show separators between option groups.
 * @param {React.ReactNode} [props.itemIndicator] - Custom indicator icon for selected items.
 * @param {React.ReactNode} [props.triggerIcon] - Custom icon for the select trigger.
 * @returns {JSX.Element} The rendered BaseSelect component.
 * @example
 * ```tsx
 * <BaseSelect
 *  value="option2"
 *  options={[
 *  {
 *  groupName: 'Group 1',
 *  options: [
 *  { value: 'option1', label: 'Option 1', leftIcon: <div>1</div> },
 *  { value: 'option2', label: 'Option 2', leftIcon: <div>2</div> },
 *  { value: 'option3', label: 'Option 3', leftIcon: <div>3</div> },
 *  ],
 *  },
 *  {
 *  groupName: 'Group 2',
 *  options: [
 *   { value: 'option4', label: 'Option 4', leftIcon: <div>4</div> },
 *   { value: 'option5', label: 'Option 5', leftIcon: <div>5</div> },
 *   { value: 'option6', label: 'Option 6', leftIcon: <div>6</div> },
 *   ],
 *   },
 *   ]}
 *   variant="warning"
 *   size="lg"
 *   placeholder="Select an option"
 *   onChange={value => console.log('Selected value:', value)}
 *   onOpenChange={open => console.log('Select is now', open ? 'open' : 'closed')}
 *   triggerIcon={<ChevronDownIcon />}
 *   triggerClassName="custom-trigger-class"
 *   contentClassName="custom-content-class"
 *   itemClassName="custom-item-class"
 *   separatorClassName="custom-separator-class"
 *   showSeparator={true}
 *   itemIndicator={<CheckIcon />}
 *   />
 *   ```
 *   @pxarks
 *   This component uses `framer-motion` for animations and `lucide-react` for icons.
 *   It is designed to be flexible and customizable, allowing developers to easily integrate it into their applications with various styles and behaviors.
 */

const MemoizedBaseSelect = React.memo(
  ({
    value,
    options,
    onChange,
    onOpenChange,
    placeholder = "Select an option",
    disabled = false,
    variant = "default",
    size = "lg",
    triggerClassName,
    contentClassName,
    itemClassName,
    separatorClassName,
    showSeparator = true,
    itemIndicator,
    triggerIcon = <ChevronDownIcon />,
    testId = "base-select",
  }: Readonly<BaseSelectProps>) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const triggerClass = React.useMemo(
      () => cn(selectTriggerVariants({ variant, size }), triggerClassName),
      [variant, size, triggerClassName],
    );

    const contentClass = React.useMemo(
      () => cn(selectContentVariants({ variant, size }), contentClassName),
      [variant, size, contentClassName],
    );

    const labelClass = React.useMemo(
      () => selectLabelVariants({ variant, size }),
      [variant, size],
    );

    const itemClass = React.useMemo(
      () => cn(selectItemVariants({ variant, size }), itemClassName),
      [variant, size, itemClassName],
    );

    return (
      <Select
        value={value}
        onValueChange={onChange}
        onOpenChange={(open) => {
          setIsOpen(open);
          onOpenChange?.(open);
        }}
        disabled={disabled}
        aria-label={placeholder}
      >
        <motion.div
          className="relative"
          whileTap={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <SelectTrigger
            className={triggerClass}
            testId={testId}
            triggerIcon={
              <motion.div
                className="flex items-center justify-center"
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {triggerIcon}
              </motion.div>
            }
            aria-label={placeholder}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
        </motion.div>
        <SelectContent testId={testId} className={contentClass}>
          {options.map((group, index) => (
            <SelectGroup key={`${group.key}-group-label}`}>
              {group.groupName && (
                <SelectLabel
                  key={group.key}
                  testId={`${testId}-${group.key}`}
                  className={cn(labelClass)}
                >
                  {group.groupName}
                </SelectLabel>
              )}
              {group.options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={itemClass}
                  icon={itemIndicator ?? option.rightIcon}
                  aria-label={option.label}
                >
                  <motion.div
                    className="flex items-center"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {option.leftIcon && (
                      <span className="mr-2 flex h-4 w-4 items-center justify-center">
                        {option.leftIcon}
                      </span>
                    )}
                    {option.label}
                  </motion.div>
                </SelectItem>
              ))}
              {index < options.length - 1 &&
                showSeparator &&
                group?.groupName && (
                  <SelectSeparator
                    key={`${group.key}-separator`}
                    className={cn("my-1", separatorClassName)}
                  />
                )}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    );
  },
);

MemoizedBaseSelect.displayName = "BaseSelect";
export const BaseSelect = MemoizedBaseSelect;
