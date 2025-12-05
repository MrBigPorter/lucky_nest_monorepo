import { AutoCompleteOption, InputModeOption } from "./constants.ts";

/**
 * Returns recommended `inputMode` and `autoComplete` attributes for a given field name.
 *
 * @param name - The name of the form field (e.g., 'phone', 'email', 'password', 'username').
 * @returns An object containing optional `inputMode` and `autoComplete` values suitable for the field.
 */
export function getFieldDefaults(name: string): {
  inputMode?: InputModeOption;
  autoComplete?: AutoCompleteOption;
} {
  const map: Record<
    string,
    Partial<{ inputMode: InputModeOption; autoComplete: AutoCompleteOption }>
  > = {
    phone: {
      inputMode: "tel",
      autoComplete: "tel",
    },
    email: {
      inputMode: "email",
      autoComplete: "email",
    },
    password: {
      inputMode: "text",
      autoComplete: "current-password",
    },
    username: {
      inputMode: "text",
      autoComplete: "username",
    },
  };
  return map[name] || {};
}
