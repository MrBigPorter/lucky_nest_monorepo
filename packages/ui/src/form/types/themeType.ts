/**
 * FormThemeVariantsClass defines the CSS class names for different
 * form elements and their states.
 * * This type is used to ensure that the class names for form elements
 * are consistent and can be easily customized.
 * * @property container - Class for the form container.
 * * @property input - Class for input fields.
 * * @property label - Class for labels.
 * * @property helpText - Class for help text.
 * * @property message - Class for messages.
 * * This type is used in the `FormTheme` to define the class names for
 * the form elements.
 * * @example
 * ```typescript
 * import { FormThemeVariantsClass } from './formTheme';
 * const customClassNames: FormThemeVariantsClass = {
 *   container: 'bg-gray-100 border-gray-300 focus-within:ring-2 focus-within:ring-purple-500',
 *   input: 'placeholder:text-purple-400 text-purple-500',
 *   label: 'text-purple-700',
 *   helpText: 'text-purple-600',
 *   message: 'text-red-600 mt-1',
 *   error: {
 *   container: 'border-red-500 bg-red-50',
 *   input: 'text-red-700 placeholder:text-red-400',
 *   label: 'text-red-700',
 *   helpText: 'text-red-600',
 *   message: 'text-red-600 mt-1',
 *   },
 *   success: {
 *   container: 'border-green-500 bg-green-50',
 *   input: 'text-green-700 placeholder:text-green-400',
 *   label: 'text-green-700',
 *   helpText: 'text-green-600',
 *   message: 'text-green-600 mt-1',
 *   },
 *   warning: {
 *   container: 'border-yellow-500 bg-yellow-50',
 *   input: 'text-yellow-700 placeholder:text-yellow-400',
 *   label: 'text-yellow-700',
 *   helpText: 'text-yellow-600',
 *   message: 'text-yellow-600 mt-1',
 *   },
 *   };
 */
export type FormThemeVariantsClass = Partial<{
  container: string;
  input: string;
  label: string;
  helpText: string;
  message: string;
}>;

export type VariantKey = "default" | "error" | "success" | "warning";

export type FormTheme = {
  size?: "sm" | "md" | "lg";
  variant?: VariantKey;
  classNames?: {
    [key in VariantKey]?: FormThemeVariantsClass;
  } & FormThemeVariantsClass;
};
