import { tv } from "tailwind-variants";

/** * @file Constants for form components in the UI kit.
 * * This file defines standard options for input modes and autocomplete attributes,
 * * as well as a size map for consistent styling across form elements.
 */
export const inputModeOptions = [
  "none",
  "text",
  "tel",
  "url",
  "email",
  "numeric",
  "decimal",
  "search",
] as const;
export type InputModeOption = (typeof inputModeOptions)[number];

/**
 * Maps input modes to their HTML standard values.
 */
export const autoCompleteOptions = [
  "on",
  "off",
  "name",
  "email",
  "username",
  "new-password",
  "current-password",
  "one-time-code",
  "organization",
  "tel",
  "tel-national",
  "tel-country-code",
  "cc-number",
  "cc-exp",
  "cc-csc",
] as const;

/*** @file Constants for form container variants.
 * * This file defines the styles for form containers,
 * * including size and variant options.
 * * It uses `tailwind-variants` for consistent styling.
 * * @example
 * ```typescript
 * import { formContainerVariants } from './constants';
 * const container = formContainerVariants({ size: 'lg', variant: 'error' });
 *
 * // Usage in a component
 * <div className={container}>This is an error container</div>
 */
export const formContainerVariants = tv({
  base: [
    "w-full flex items-center",
    "px-4 py-2.5",
    "rounded-lg border",
    "bg-gray-50 dark:bg-black/20",
    "border-gray-200 dark:border-white/10",
    "outline-none transition-all",
    // 聚焦时统一用 focus-within
    "focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500",
  ].join(" "),
  variants: {
    size: {
      sm: "text-[14px]",
      md: "text-[16px]",
      lg: "text-[18px]",
    },
    variant: {
      default: "", // 用 base 的默认灰色边框
      error:
        "border-red-500 bg-red-50 focus-within:ring-red-400 focus-within:ring-2",
      success:
        "border-green-500 bg-green-50 focus-within:ring-green-400 focus-within:ring-2",
      warning:
        "border-yellow-500 bg-yellow-50 focus-within:ring-yellow-400 focus-within:ring-2",
    },
    disabled: {
      true: "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60",
      false: "",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});
/*** @file Constants for form input variants.
 * * This file defines the styles for form inputs,
 * * including size and variant options.
 * * It uses `tailwind-variants` for consistent styling.
 * * @example
 * ```typescript
 * import { formInputVariants } from './constants';
 * const input = formInputVariants({ size: 'lg', variant: 'error' });
 *
 * // Usage in a component
 * <input className={input} placeholder="This is an error input" />
 */
export const formInputVariants = tv({
  base: [
    "bh-transition-all",
    "w-full h-full",
    "bg-transparent",
    "outline-none ring-0",
    "focus:outline-none focus:ring-0 focus:border-transparent",
    "text-gray-900 dark:text-white",
    "placeholder:text-gray-400 dark:placeholder:text-gray-600",
  ].join(" "),
  variants: {
    size: {
      sm: "text-[14px]",
      md: "text-[16px]",
      lg: "text-[18px]",
    },
    variant: {
      default: "",
      error: "text-red-700 placeholder:text-red-400",
      success: "text-green-700 placeholder:text-green-400",
      warning: "text-yellow-700 placeholder:text-yellow-400",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});
/*** @file Constants for form label variants.
 * * This file defines the styles for form labels,
 * * including size and variant options.
 * * It uses `tailwind-variants` for consistent styling.
 * * @example
 * ```typescript
 * import { FormLabelVariants } from './constants';
 * const label = FormLabelVariants({ size: 'lg', variant: 'error' });
 *
 * // Usage in a component
 * <label className={label}>This is an error label</label>
 */
export const FormLabelVariants = tv({
  base: "block font-medium mb-1.5 text-gray-700 dark:text-gray-300",
  variants: {
    size: {
      sm: "text-[14px]",
      md: "text-[16px]",
      lg: "text-[18px]",
    },
    variant: {
      default: "",
      error: "text-red-700",
      success: "text-green-700",
      warning: "text-yellow-700",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

/*** @file Constants for form help text variants.
 * * This file defines the styles for help text in forms,
 * * including size and variant options.
 * * It uses `tailwind-variants` for consistent styling.
 * * @example
 * ```typescript
 * import { FormHelpTextVariants } from './constants';
 * const helpText = FormHelpTextVariants({ variant: 'error' });
 *
 * // Usage in a component
 * <p className={helpText}>This is an error message</p>
 */
export const FormHelpTextVariants = tv({
  base: "mt-1",
  variants: {
    size: {
      sm: "text-[12px]",
      md: "text-[13px]",
      lg: "text-[14px]",
    },
    variant: {
      default: "text-gray-500",
      error: "text-red-500",
      success: "text-green-500",
      warning: "text-yellow-500",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

/** @file Constants for form message variants.
 * * This file defines the styles for different message types
 * * such as error, success, and warning.
 * * It uses `tailwind-variants` for consistent styling.
 * * @example
 * ```typescript
 * import { formMessageVariants } from './constants';
 * const errorMessage = formMessageVariants({ variant: 'error' });
 *
 *  * // Usage in a component
 *  * <p className={errorMessage}>This is an error message</p>
 *
 */
export const FormMessageVariants = tv({
  base: "text-[13px] mt-1",
  variants: {
    variant: {
      default: "",
      error: "text-red-500",
      success: "text-green-500",
      warning: "text-yellow-500",
    },
  },
  defaultVariants: {
    variant: "error",
  },
});
export type AutoCompleteOption = (typeof autoCompleteOptions)[number];
