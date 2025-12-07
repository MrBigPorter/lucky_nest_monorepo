import React, { createContext, useContext } from "react";
import type { FormTheme } from "../types/themeType";

/** * FormThemeProvider provides a context for theming form components.
 * * It allows you to define a custom theme for form components that can be accessed
 * via the `useFormTheme` hook.
 * * @example
 * ```tsx
 * import { FormThemeProvider, useFormTheme } from './FormThemeProvider';
 * * const MyForm = () => {
 *   const theme = useFormTheme();
 *   return (
 *   <form className={theme.classNames.container}>
 *       <input className={theme.classNames.input} />
 *       <label className={theme.classNames.label}>Label</label>
 *       <p className={theme.classNames.helpText}>Help text</p>
 *       <p className={theme.classNames.message}>Message</p>
 *       <p className={theme.classNames.error.message}>Error message</p>
 *
 *          </form>
 *          );
 *          }
 */
const FormThemeContext = createContext<FormTheme>({});

export const FormThemeProvider = ({
  theme: FormTheme = {},
  children,
}: {
  theme?: FormTheme;
  children: React.ReactNode;
}) => {
  return (
    <FormThemeContext.Provider value={FormTheme}>
      {children}
    </FormThemeContext.Provider>
  );
};

/**
 * useFormTheme is a custom hook to access the form theme context.
 * * It must be used within a FormThemeProvider.
 * * @throws {Error} If used outside of a FormThemeProvider.
 * * @returns {FormTheme} The current form theme.
 */
export const useFormTheme = () => {
  const context = useContext(FormThemeContext);
  if (!context) {
    throw new Error("useFormTheme must be used within a FormThemeProvider");
  }
  return context;
};
