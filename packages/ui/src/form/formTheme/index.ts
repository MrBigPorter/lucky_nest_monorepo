import type {
  FormTheme,
  FormThemeVariantsClass,
  VariantKey,
} from "../types/themeType";
import { cn } from "../../lib/utils";

/**
 * Creates a form theme by merging the default theme with custom properties.
 * This allows for easy customization of form styles while maintaining
 * the base styles defined in the default theme.
 * * @example
 * ```typescript
 * import { createFormTheme } from './formTheme';
 * const customTheme = createFormTheme({
 *   size: 'lg',
 *   variant: 'success',
 *   classNames: {
 *   container: 'bg-gray-100',
 *    input: 'text-blue-500',
 *    label: 'text-blue-700',
 *    helpText: 'text-blue-500',
 *    error: {
 *    container: 'border-blue-500 bg-blue-50',
 *    input: 'text-blue-700 placeholder:text-blue-400',
 *    label: 'text-blue-700',
 *    helpText: 'text-blue-600',
 *    message: 'text-blue-600 mt-1',
 *    },
 *    success: {
 *    container: 'border-green-500 bg-green-50',
 *    input: 'text-green-700 placeholder:text-green-400',
 *    label: 'text-green-700',
 *    helpText: 'text-green-600',
 *    message: 'text-green-600 mt-1',
 *    },
 *    warning: {
 *     container: 'border-yellow-500 bg-yellow-50',
 *     input: 'text-yellow-700 placeholder:text-yellow-400',
 *     label: 'text-yellow-700',
 *     helpText: 'text-yellow-600',
 *     message: 'text-yellow-600 mt-1',
 *     },
 *     },
 *     });
 *     ```
 * @param theme
 */

export function createFormTheme(theme: Partial<FormTheme>): FormTheme {
  return {
    ...theme,
    classNames: {
      ...theme.classNames,
      error: {
        ...theme.classNames?.error,
      },
      success: {
        ...theme.classNames?.success,
      },
      warning: {
        ...theme.classNames?.warning,
      },
    },
  };
}

export function getVariantClassNames<T extends keyof FormThemeVariantsClass>(
  theme: FormTheme,
  variant: VariantKey,
  classNames: Partial<FormTheme["classNames"]>,
  key: T,
) {
  return cn(
    theme.classNames?.[variant]?.[key] ?? theme.classNames?.[key] ?? "",
    classNames?.[variant]?.[key] ?? classNames?.[key] ?? "",
  );
}
